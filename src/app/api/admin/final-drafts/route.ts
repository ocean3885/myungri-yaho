import { NextResponse } from 'next/server';

import { getAdminAccess } from '@/lib/admin-access';
import { DEEPSEEK_API_URL, DEEPSEEK_MODEL } from '@/lib/deepseek';
import {
  FINAL_DRAFT_PROVIDERS,
  mapFinalDraftComparison,
  type FinalDraftProvider,
} from '@/lib/final-draft-comparison';
import { createAdminClient } from '@/utils/supabase/server';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const MAX_INPUT_LENGTH = 80_000;

type GenerateBody = {
  draft?: unknown;
  systemPrompt?: unknown;
  userPrompt?: unknown;
  providers?: unknown;
};

type ProviderResult = {
  provider: FinalDraftProvider;
  model: string;
  resultText: string | null;
  status: 'completed' | 'failed';
  errorMessage: string | null;
  durationMs: number;
};

export async function POST(request: Request) {
  const admin = await getAdminAccess();
  if (!admin) return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 403 });

  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const draft = normalizeRequiredText(body.draft);
  const systemPrompt = normalizeRequiredText(body.systemPrompt);
  const userPromptTemplate = normalizeRequiredText(body.userPrompt);
  const providers = normalizeProviders(body.providers);

  if (!draft || !systemPrompt || !userPromptTemplate) {
    return NextResponse.json({ message: '초안, System Prompt, User Prompt를 모두 입력해주세요.' }, { status: 400 });
  }
  if ([draft, systemPrompt, userPromptTemplate].some((value) => value.length > MAX_INPUT_LENGTH)) {
    return NextResponse.json({ message: `각 입력은 ${MAX_INPUT_LENGTH.toLocaleString()}자 이하여야 합니다.` }, { status: 400 });
  }
  if (providers.length === 0) {
    return NextResponse.json({ message: '비교할 API를 하나 이상 선택해주세요.' }, { status: 400 });
  }

  const userPrompt = userPromptTemplate.includes('{{draft}}')
    ? userPromptTemplate.replaceAll('{{draft}}', draft)
    : `${userPromptTemplate}\n\n[상담 초안]\n${draft}`;
  const batchId = crypto.randomUUID();
  const generatedResults = await Promise.all(
    providers.map((provider) => generateWithProvider(provider, systemPrompt, userPrompt)),
  );

  const rows = generatedResults.map((result) => ({
    batch_id: batchId,
    created_by: admin.userId,
    draft,
    system_prompt: systemPrompt,
    user_prompt: userPromptTemplate,
    provider: result.provider,
    model: result.model,
    result_text: result.resultText,
    status: result.status,
    error_message: result.errorMessage,
    duration_ms: result.durationMs,
  }));
  const adminSupabase = await createAdminClient();
  const { data, error } = await adminSupabase
    .from('final_draft_comparisons')
    .insert(rows)
    .select('id, batch_id, draft, system_prompt, user_prompt, provider, model, result_text, status, error_message, duration_ms, created_at');

  if (error) {
    console.error('Final draft comparison save failed:', error);
    return NextResponse.json({ message: '결과 생성은 완료됐지만 비교 이력 저장에 실패했습니다.' }, { status: 502 });
  }

  return NextResponse.json({
    message: `${providers.length}개 API 비교를 완료했습니다.`,
    batchId,
    results: (data || []).map((row) => mapFinalDraftComparison(row)),
  });
}

async function generateWithProvider(
  provider: FinalDraftProvider,
  systemPrompt: string,
  userPrompt: string,
): Promise<ProviderResult> {
  const startedAt = Date.now();
  const model = getProviderModel(provider);

  try {
    const resultText = provider === 'deepseek'
      ? await requestDeepSeek(model, systemPrompt, userPrompt)
      : provider === 'openai'
        ? await requestOpenAI(model, systemPrompt, userPrompt)
        : await requestGemini(model, systemPrompt, userPrompt);

    return { provider, model, resultText, status: 'completed', errorMessage: null, durationMs: Date.now() - startedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'API 호출에 실패했습니다.';
    console.error(`Final draft ${provider} generation failed:`, error);
    return { provider, model, resultText: null, status: 'failed', errorMessage: message, durationMs: Date.now() - startedAt };
  }
}

async function requestDeepSeek(model: string, systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY가 설정되지 않았습니다.');

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 8_000,
      temperature: 0.5,
    }),
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(getApiError(data, 'DeepSeek API 요청에 실패했습니다.'));
  return requireResultText(data?.choices?.[0]?.message?.content);
}

async function requestOpenAI(model: string, systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY 또는 CHATGPT_API_KEY가 설정되지 않았습니다.');

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, instructions: systemPrompt, input: userPrompt, max_output_tokens: 8_000, store: false }),
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(getApiError(data, 'OpenAI API 요청에 실패했습니다.'));
  const text = data?.output
    ?.flatMap((item: { type?: string; content?: unknown[] }) => item.type === 'message' ? item.content || [] : [])
    .filter((item: { type?: string; text?: unknown }) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item: { text: string }) => item.text)
    .join('\n\n');
  return requireResultText(text);
}

async function requestGemini(model: string, systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 8_000 },
      }),
      cache: 'no-store',
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(getApiError(data, 'Gemini API 요청에 실패했습니다.'));
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: unknown }) => typeof part.text === 'string' ? part.text : '')
    .join('\n');
  return requireResultText(text);
}

function getProviderModel(provider: FinalDraftProvider) {
  if (provider === 'deepseek') return process.env.DEEPSEEK_FINAL_MODEL || DEEPSEEK_MODEL;
  if (provider === 'openai') return process.env.OPENAI_FINAL_MODEL || 'gpt-4.1-mini';
  return process.env.GEMINI_FINAL_MODEL || 'gemini-2.5-flash';
}

function normalizeProviders(value: unknown): FinalDraftProvider[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is FinalDraftProvider => (
    typeof item === 'string' && FINAL_DRAFT_PROVIDERS.includes(item as FinalDraftProvider)
  )))];
}

function normalizeRequiredText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function requireResultText(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('API 응답 결과가 비어 있습니다.');
  return value.trim();
}

function getApiError(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;
  const error = (data as { error?: unknown }).error;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
}
