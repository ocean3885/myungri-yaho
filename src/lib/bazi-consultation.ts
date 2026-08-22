import { revalidatePath } from 'next/cache';
import type { BaziResult } from '@/components/bazi/types';
import { createAdminClient } from '@/utils/supabase/server';
import { getConsultationTypeByKey, type ConsultationType } from '@/lib/consultation-types';
import { DEEPSEEK_API_URL, DEEPSEEK_MODEL } from '@/lib/deepseek';
import { cancelPortOnePayment } from '@/lib/portone';
import {
    buildStepResultsText,
    buildBaziPromptContext,
    getBaziPromptPipelineConfigBySettingKey,
    getBaziPromptPipelineConfig,
    renderBaziPromptTemplate,
    type BaziGenerationMetadata,
    type BaziPromptPipelineConfig,
    type BaziPromptStepConfig,
    type BaziPromptStepResult,
} from '@/lib/bazi-prompt-config';

const FINALIZE_STEP_RESULT_CHAR_LIMIT = 4800;
const COMPACTED_STEP_RESULT_MAX_TOKENS = 1800;

export type ConsultationPromptSubject = { subjectName: string; result: BaziResult };

export async function generateAndStoreBaziInterpretation({
    consultationId,
    result,
    subjects,
    consultationType,
    revalidatePaths,
}: {
    consultationId: string;
    result: BaziResult;
    subjects?: ConsultationPromptSubject[];
    consultationType?: string;
    revalidatePaths: string[];
}) {
    const adminSupabase = await createAdminClient();

    try {
        const resolvedType = await getConsultationTypeByKey(adminSupabase, consultationType);
        const generation = await runBaziGenerationPipeline(adminSupabase, result, resolvedType, subjects);
        const { error } = await adminSupabase
            .from('user_consultations')
            .update({
                prompt: generation.prompt,
                result_text: generation.interpretation,
                status: 'completed',
                completed_at: new Date().toISOString(),
                error_message: null,
                prompt_version: generation.promptVersion,
                generation_metadata: generation.metadata,
            })
            .eq('id', consultationId);

        if (error) throw error;
    } catch (error) {
        console.error(`Background user consultation interpretation failed:`, error);
        const message = error instanceof Error ? error.message : '사주 해설 생성에 실패했습니다.';
        const { data: consultation } = await adminSupabase
            .from('user_consultations')
            .select('payment_order_id')
            .eq('id', consultationId)
            .maybeSingle();
        await adminSupabase
            .from('user_consultations')
            .update({
                status: 'failed',
                error_message: message,
            })
            .eq('id', consultationId);
        if (consultation?.payment_order_id) {
            const { data: order } = await adminSupabase
                .from('consultation_payment_orders')
                .select('id, payment_id')
                .eq('id', consultation.payment_order_id)
                .maybeSingle();
            if (order) {
                await adminSupabase.from('consultation_payment_orders').update({ status: 'refund_pending', updated_at: new Date().toISOString() }).eq('id', order.id);
                try {
                    await cancelPortOnePayment(order.payment_id, '상담 콘텐츠 생성 실패');
                    await adminSupabase.from('consultation_payment_orders').update({ status: 'refunded', refunded_at: new Date().toISOString(), refund_error: null, updated_at: new Date().toISOString() }).eq('id', order.id);
                } catch (refundError) {
                    await adminSupabase.from('consultation_payment_orders').update({ status: 'refund_failed', refund_error: refundError instanceof Error ? refundError.message : '결제 취소 실패', updated_at: new Date().toISOString() }).eq('id', order.id);
                }
            }
        }
    } finally {
        revalidatePaths.forEach((path) => revalidatePath(path));
    }
}

export async function buildBaziPrompt(
    adminSupabase: unknown,
    result: BaziResult,
    consultationType?: ConsultationType,
    subjects?: ConsultationPromptSubject[],
) {
    const config = consultationType
        ? await getBaziPromptPipelineConfigBySettingKey(adminSupabase, consultationType.promptSettingKey)
        : await getBaziPromptPipelineConfig(adminSupabase);
    const step = config.steps.find((item) => item.enabled) || config.steps[0];

    return renderBaziPromptTemplate(step.userPromptTemplate, result, buildMultiSubjectPromptContext(subjects));
}

export function getKstDateString() {
    return getKstNow().toISOString().slice(0, 10);
}

export function normalizeSubjectName(value?: string) {
    const name = value?.trim().slice(0, 30);
    return name || null;
}

async function runBaziGenerationPipeline(adminSupabase: unknown, result: BaziResult, consultationType: ConsultationType, subjects?: ConsultationPromptSubject[]) {
    const config = await getBaziPromptPipelineConfigBySettingKey(adminSupabase, consultationType.promptSettingKey);

    if (!consultationType.enabled) {
        throw new Error('현재 사용할 수 없는 상담 프롬프트입니다.');
    }

    const enabledSteps = config.steps.filter((step) => step.enabled);
    const steps = enabledSteps.length > 0 ? enabledSteps : config.steps.slice(0, 1);
    const subjectContext = buildMultiSubjectPromptContext(subjects);

    if (!config.enabled) {
        const singleStep = steps[0];
        const userPrompt = renderBaziPromptTemplate(singleStep.userPromptTemplate, result, subjectContext);
        const stepResult = await runBaziAnalysisStep(singleStep, config, result, '', subjectContext);

        if (!stepResult.ok || !stepResult.content.trim()) {
            throw new Error(stepResult.error || '사주 해설 분석 단계가 실패했습니다.');
        }

        return {
            interpretation: stepResult.content,
            prompt: userPrompt,
            promptVersion: config.version,
            metadata: {
                promptVersion: config.version,
                model: config.model || DEEPSEEK_MODEL,
                generatedAt: new Date().toISOString(),
                consultationTypeKey: consultationType.key,
                promptSettingKey: consultationType.promptSettingKey,
                steps: [stepResult],
            },
        };
    }

    const stepResults = config.executionMode === 'sequential'
        ? await runSequentialBaziAnalysisSteps(steps, config, result, subjectContext)
        : await Promise.all(steps.map((step) => runBaziAnalysisStep(step, config, result, '', subjectContext)));
    const successfulStepResults = stepResults.filter((step) => step.ok && step.content.trim());

    if (successfulStepResults.length === 0) {
        throw new Error('사주 해설 분석 단계가 모두 실패했습니다.');
    }

    const stepResultsText = await buildFinalStepResultsText(successfulStepResults, config);
    const finalPrompt = renderBaziPromptTemplate(config.finalize.userPromptTemplate, result, {
        ...subjectContext,
        stepResults: stepResultsText,
    });
    const interpretation = await requestDeepSeekCompletion({
        model: config.model || DEEPSEEK_MODEL,
        systemPrompt: config.finalize.systemPrompt,
        userPrompt: finalPrompt,
        maxTokens: config.finalize.maxTokens,
        temperature: config.finalize.temperature,
        errorLabel: 'DeepSeek final bazi consultation failed',
    });
    const metadata: BaziGenerationMetadata = {
        promptVersion: config.version,
        model: config.model || DEEPSEEK_MODEL,
        generatedAt: new Date().toISOString(),
        consultationTypeKey: consultationType.key,
        promptSettingKey: consultationType.promptSettingKey,
        steps: stepResults,
    };

    return {
        interpretation,
        prompt: finalPrompt,
        promptVersion: config.version,
        metadata,
    };
}

async function buildFinalStepResultsText(results: BaziPromptStepResult[], config: BaziPromptPipelineConfig) {
    const compactedResults = await Promise.all(results.map(async (result) => {
        const content = result.content.trim();
        if (content.length <= FINALIZE_STEP_RESULT_CHAR_LIMIT) return result;

        try {
            const compactedContent = await requestDeepSeekCompletion({
                model: config.model || DEEPSEEK_MODEL,
                systemPrompt: '당신은 사주 분석 초안을 최종 편집 단계에 전달하기 좋게 압축하는 한국어 편집자입니다. 핵심 판단, 명식 근거, 주의점, 조언은 보존하고 반복 표현만 줄입니다.',
                userPrompt: [
                    `[${result.label}] 분석 초안이 너무 깁니다.`,
                    '아래 내용을 최종 상담문 작성에 필요한 핵심 근거 중심으로 압축해 주세요.',
                    '새로운 해석을 추가하지 말고, 원문에 있는 중요한 판단과 근거를 빠뜨리지 마세요.',
                    '마크다운 기호는 쓰지 말고 자연스러운 한국어 문단으로 정리해 주세요.',
                    '',
                    content,
                ].join('\n'),
                maxTokens: COMPACTED_STEP_RESULT_MAX_TOKENS,
                temperature: 0.2,
                errorLabel: `DeepSeek bazi step compaction failed: ${result.key}`,
            });

            return {
                ...result,
                content: compactedContent,
            };
        } catch (error) {
            console.error(`Bazi step compaction fallback used: ${result.key}`, error);
            return {
                ...result,
                content: [
                    content.slice(0, Math.floor(FINALIZE_STEP_RESULT_CHAR_LIMIT * 0.65)),
                    '',
                    content.slice(-Math.floor(FINALIZE_STEP_RESULT_CHAR_LIMIT * 0.35)),
                    '',
                    '[압축 단계 실패로 원문의 앞부분과 끝부분을 함께 전달했습니다.]',
                ].join('\n'),
            };
        }
    }));

    return buildStepResultsText(compactedResults);
}

async function runBaziAnalysisStep(
    step: BaziPromptStepConfig,
    config: BaziPromptPipelineConfig,
    result: BaziResult,
    previousStepResults = '',
    subjectContext: Record<string, string> = {},
): Promise<BaziPromptStepResult> {
    const userPrompt = renderBaziPromptTemplate(step.userPromptTemplate, result, {
        ...subjectContext,
        previousStepResults,
    });

    try {
        const content = await requestDeepSeekCompletion({
            model: config.model || DEEPSEEK_MODEL,
            systemPrompt: step.systemPrompt,
            userPrompt,
            maxTokens: step.maxTokens,
            temperature: step.temperature,
            errorLabel: `DeepSeek bazi step failed: ${step.key}`,
        });

        return {
            key: step.key,
            label: step.label,
            ok: true,
            content,
        };
    } catch (error) {
        return {
            key: step.key,
            label: step.label,
            ok: false,
            content: '',
            error: error instanceof Error ? error.message : '분석 단계 생성에 실패했습니다.',
        };
    }
}

async function runSequentialBaziAnalysisSteps(
    steps: BaziPromptStepConfig[],
    config: BaziPromptPipelineConfig,
    result: BaziResult,
    subjectContext: Record<string, string>,
) {
    const results: BaziPromptStepResult[] = [];

    for (const step of steps) {
        const previousStepResults = buildStepResultsText(results.filter((item) => item.ok && item.content.trim()));
        const stepResult = await runBaziAnalysisStep(step, config, result, previousStepResults, subjectContext);
        results.push(stepResult);
    }

    return results;
}

function buildMultiSubjectPromptContext(subjects?: ConsultationPromptSubject[]) {
    if (!subjects || subjects.length === 0) return {};
    const contexts = subjects.map((subject) => {
        const context = buildBaziPromptContext(subject.result);
        return { context, name: subject.subjectName, baziJson: context.baziJson, baziSummary: context.baziSummary };
    });
    const extra: Record<string, string> = {
        subjectCount: String(contexts.length),
        subjectsJson: JSON.stringify(contexts.map((context) => ({ name: context.name, bazi: JSON.parse(context.baziJson) }))),
        subjectsSummary: contexts.map((context, index) => `[인물 ${index + 1}: ${context.name}]\n${context.baziSummary}`).join('\n\n'),
    };
    contexts.forEach((context, index) => {
        const number = index + 1;
        extra[`person${number}Name`] = context.name;
        extra[`person${number}BaziJson`] = context.baziJson;
        extra[`person${number}BaziSummary`] = context.baziSummary;
    });
    return extra;
}

async function requestDeepSeekCompletion({
    model,
    systemPrompt,
    userPrompt,
    maxTokens,
    temperature,
    errorLabel,
}: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
    temperature: number;
    errorLabel: string;
}) {
    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
            max_tokens: maxTokens,
            temperature,
        }),
        cache: 'no-store',
    });
    const data = await response.json();

    if (!response.ok) {
        console.error(errorLabel, data);
        throw new Error('사주 원국 해설 생성에 실패했습니다.');
    }

    const choice = data?.choices?.[0];
    const content = choice?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
        const finishReason = choice?.finish_reason;
        const reasoningTokens = data?.usage?.completion_tokens_details?.reasoning_tokens;
        const reasoningContent = choice?.message?.reasoning_content;

        console.error(errorLabel, {
            reason: 'empty_content',
            finishReason,
            reasoningTokens,
            hasReasoningContent: typeof reasoningContent === 'string' && Boolean(reasoningContent.trim()),
            contentPreview: typeof content === 'string' ? content.slice(0, 300) : null,
            reasoningContentPreview: typeof reasoningContent === 'string' ? reasoningContent.slice(0, 300) : null,
            usage: data?.usage,
        });

        if (finishReason === 'length' && Number(reasoningTokens) > 0) {
            throw new Error('DeepSeek이 추론 과정에서 토큰 한도를 모두 사용해 최종 해설을 생성하지 못했습니다. Max Tokens를 늘리거나 프롬프트를 더 짧게 조정해 주세요.');
        }

        if (typeof reasoningContent === 'string' && reasoningContent.trim()) {
            throw new Error('DeepSeek이 추론 내용만 반환하고 최종 해설을 반환하지 않았습니다. Max Tokens를 늘리거나 프롬프트에 최종 답변을 짧게 작성하도록 조정해 주세요.');
        }

        throw new Error('생성된 해설이 비어 있습니다.');
    }

    return content.trim();
}

function getKstNow() {
    return new Date(Date.now() + 9 * 60 * 60 * 1000);
}
