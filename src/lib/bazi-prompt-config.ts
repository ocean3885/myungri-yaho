import type { SupabaseClient } from '@supabase/supabase-js';
import type { BaziResult } from '@/components/bazi/types';
import { DEEPSEEK_MODEL } from '@/lib/deepseek';

export const BAZI_PROMPT_SETTING_KEY = 'bazi_free_consultation_prompt_pipeline';

export type BaziPromptStepConfig = {
    key: string;
    label: string;
    enabled: boolean;
    systemPrompt: string;
    userPromptTemplate: string;
    temperature: number;
    maxTokens: number;
};

export type BaziFinalizePromptConfig = {
    systemPrompt: string;
    userPromptTemplate: string;
    temperature: number;
    maxTokens: number;
};

export type BaziPromptPipelineConfig = {
    enabled: boolean;
    version: string;
    model: string;
    executionMode: 'parallel' | 'sequential';
    steps: BaziPromptStepConfig[];
    finalize: BaziFinalizePromptConfig;
};

export type BaziPromptStepResult = {
    key: string;
    label: string;
    ok: boolean;
    content: string;
    error?: string;
};

export type BaziGenerationMetadata = {
    promptVersion: string;
    model: string;
    generatedAt: string;
    steps: BaziPromptStepResult[];
};

export const defaultBaziPromptPipelineConfig: BaziPromptPipelineConfig = {
    enabled: true,
    version: 'free-bazi-rich-v1',
    model: DEEPSEEK_MODEL,
    executionMode: 'parallel',
    steps: [
        {
            key: 'core',
            label: '원국 구조 분석',
            enabled: true,
            systemPrompt: '당신은 한국어로 사주 원국의 구조, 월령, 일간의 힘, 오행 흐름을 정밀하게 해석하는 명리학 상담사입니다. 운명 단정, 공포 조장, 건강/투자/법률 확정 조언은 피합니다.',
            userPromptTemplate: [
                '{{baziSummary}}',
                '',
                '위 명식의 원국 구조를 깊이 있게 분석해 주세요.',
                '일간의 상태, 월령의 작용, 오행의 흐름, 사주 네 기둥의 상호작용을 중심으로 설명합니다.',
                '합, 충, 형, 파, 해, 묘고 등 글자 관계가 의미를 만드는 경우 그 이유를 구체적으로 짚어주세요.',
                '마크다운 기호는 쓰지 말고, 정중한 한국어 경어체로 작성해 주세요.',
            ].join('\n'),
            temperature: 0.45,
            maxTokens: 1800,
        },
        {
            key: 'personality',
            label: '성향 및 관계 분석',
            enabled: true,
            systemPrompt: '당신은 사주 원국을 바탕으로 성향, 사고방식, 감정 표현, 대인관계 패턴을 현실적으로 설명하는 한국어 상담사입니다.',
            userPromptTemplate: [
                '{{baziSummary}}',
                '',
                '위 명식에서 드러나는 성향, 사고방식, 대인관계 흐름을 분석해 주세요.',
                '장점과 보완점을 균형 있게 설명하고, 단정적 성격 규정은 피합니다.',
                '왜 그렇게 볼 수 있는지 원국의 글자와 오행 작용을 근거로 설명해 주세요.',
            ].join('\n'),
            temperature: 0.55,
            maxTokens: 1800,
        },
        {
            key: 'career',
            label: '적성 및 일의 방식 분석',
            enabled: true,
            systemPrompt: '당신은 사주 원국의 십신, 오행, 궁위 흐름을 바탕으로 적성, 일 처리 방식, 사회적 역할을 분석하는 한국어 명리 상담사입니다.',
            userPromptTemplate: [
                '{{baziSummary}}',
                '',
                '위 명식의 적성, 일 처리 방식, 직업적 강점과 보완점을 분석해 주세요.',
                '특정 직업을 단정하기보다 어떤 환경, 역할, 일의 방식에서 강점이 드러나기 쉬운지 설명합니다.',
                '일간, 월지, 식상/재성/관성/인성의 작용이 보이면 그 흐름을 풀어주세요.',
            ].join('\n'),
            temperature: 0.55,
            maxTokens: 1800,
        },
        {
            key: 'flow',
            label: '대운 및 세운 흐름 분석',
            enabled: true,
            systemPrompt: '당신은 사주 원국과 현재 대운, 세운의 관계를 조심스럽고 현실적인 언어로 해석하는 한국어 상담사입니다.',
            userPromptTemplate: [
                '{{baziSummary}}',
                '',
                '현재 운 흐름을 원국과 연결해 분석해 주세요.',
                '현재 대운: {{currentDaewoon}}',
                '현재 세운: {{currentYear}}년 {{currentSewoon}}',
                '대운과 세운이 원국에 주는 자극, 보완, 긴장, 전환 가능성을 구조 중심으로 설명합니다.',
                '사건을 확정적으로 예언하지 말고 흐름과 주의점 중심으로 작성해 주세요.',
            ].join('\n'),
            temperature: 0.5,
            maxTokens: 1600,
        },
    ],
    finalize: {
        systemPrompt: '당신은 여러 사주 분석 초안을 하나의 자연스럽고 깊이 있는 최종 상담문으로 편집하는 전문 한국어 편집자입니다.',
        userPromptTemplate: [
            '{{baziSummary}}',
            '',
            '[분석 초안]',
            '{{stepResults}}',
            '',
            '위 분석 초안을 바탕으로 하나의 완성된 무료 사주 원국 해설문을 작성해 주세요.',
            '요구사항:',
            '1. 분석 내용의 깊이와 근거는 유지하되 중복은 제거합니다.',
            '2. 문단 흐름은 [1. 원국의 핵심 구조], [2. 성향과 관계], [3. 적성과 일의 방식], [4. 현재 운 흐름], [5. 보완점과 조언] 형태로 정리합니다.',
            '3. 맹파, 맹파명리, 맹파명리학 같은 특정 학파명은 최종문에 쓰지 말고 명리학 또는 명리로 자연스럽게 바꿉니다.',
            '4. 마크다운 기호(###, **, *, -, _)는 쓰지 않습니다.',
            '5. 운명 단정, 공포 조장, 건강/투자/법률 확정 조언은 피합니다.',
            '6. 마지막에 AI 상담은 부정확할 수 있으므로 보다 정확한 상담은 유료상담 서비스를 이용하시라는 취지의 문장을 자연스럽게 추가합니다.',
        ].join('\n'),
        temperature: 0.35,
        maxTokens: 5000,
    },
};

export async function getBaziPromptPipelineConfig(adminSupabase: SupabaseClient) {
    const { data, error } = await adminSupabase
        .from('service_settings')
        .select('value')
        .eq('key', BAZI_PROMPT_SETTING_KEY)
        .maybeSingle();

    if (error) {
        console.error('Bazi prompt pipeline setting query error:', error);
        return defaultBaziPromptPipelineConfig;
    }

    return normalizeBaziPromptPipelineConfig(data?.value);
}

export function normalizeBaziPromptPipelineConfig(value: unknown): BaziPromptPipelineConfig {
    const source = isObject(value) ? value : {};
    const fallback = defaultBaziPromptPipelineConfig;
    const stepsValue = Array.isArray(source.steps) ? source.steps : fallback.steps;
    const steps = stepsValue
        .map((step, index) => normalizeStepConfig(step, fallback.steps[index] || fallback.steps[0], index))
        .filter((step): step is BaziPromptStepConfig => Boolean(step));
    const finalizeSource = isObject(source.finalize) ? source.finalize : {};

    return {
        enabled: typeof source.enabled === 'boolean' ? source.enabled : fallback.enabled,
        version: getString(source.version, fallback.version),
        model: getString(source.model, fallback.model),
        executionMode: source.executionMode === 'sequential' ? 'sequential' : fallback.executionMode,
        steps: steps.length > 0 ? steps : fallback.steps,
        finalize: {
            systemPrompt: getString(finalizeSource.systemPrompt, fallback.finalize.systemPrompt),
            userPromptTemplate: getString(finalizeSource.userPromptTemplate, fallback.finalize.userPromptTemplate),
            temperature: getNumber(finalizeSource.temperature, fallback.finalize.temperature, 0, 2),
            maxTokens: getInteger(finalizeSource.maxTokens, fallback.finalize.maxTokens, 256, 8000),
        },
    };
}

export function renderBaziPromptTemplate(template: string, result: BaziResult, extra: Record<string, string> = {}) {
    const context = buildBaziPromptContext(result);
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
        return extra[key] ?? context[key] ?? '';
    });
}

export function buildDefaultBaziPrompt(result: BaziResult) {
    const firstEnabledStep = defaultBaziPromptPipelineConfig.steps.find((step) => step.enabled) || defaultBaziPromptPipelineConfig.steps[0];
    return renderBaziPromptTemplate(firstEnabledStep.userPromptTemplate, result);
}

export function buildStepResultsText(results: BaziPromptStepResult[]) {
    return results
        .map((result) => [
            `[${result.label}]`,
            result.ok ? result.content : `생성 실패: ${result.error || '알 수 없는 오류'}`,
        ].join('\n'))
        .join('\n\n');
}

function normalizeStepConfig(value: unknown, fallback: BaziPromptStepConfig | undefined, index: number) {
    if (!fallback && !isObject(value)) return null;

    const source = isObject(value) ? value : {};
    const base = fallback || {
        key: `step-${index + 1}`,
        label: `분석 ${index + 1}`,
        enabled: true,
        systemPrompt: defaultBaziPromptPipelineConfig.steps[0].systemPrompt,
        userPromptTemplate: defaultBaziPromptPipelineConfig.steps[0].userPromptTemplate,
        temperature: 0.5,
        maxTokens: 1600,
    };

    return {
        key: sanitizeKey(getString(source.key, base.key || `step-${index + 1}`)),
        label: getString(source.label, base.label || `분석 ${index + 1}`),
        enabled: typeof source.enabled === 'boolean' ? source.enabled : base.enabled,
        systemPrompt: getString(source.systemPrompt, base.systemPrompt),
        userPromptTemplate: getString(source.userPromptTemplate, base.userPromptTemplate),
        temperature: getNumber(source.temperature, base.temperature, 0, 2),
        maxTokens: getInteger(source.maxTokens, base.maxTokens, 256, 8000),
    };
}

function buildBaziPromptContext(result: BaziResult): Record<string, string> {
    const pillars: Partial<NonNullable<BaziResult['four_pillars']>> = result.four_pillars || {};
    const gender = result.meta?.gender || '사용자';
    const yearPillar = formatPillar(pillars.year);
    const monthPillar = formatPillar(pillars.month);
    const dayPillar = formatPillar(pillars.day);
    const timePillar = formatPillar(pillars.time);
    const currentYear = getKstYear();
    const daewoonList = result.daewoon?.list || [];
    const currentDaewoon = result.daewoon?.current || findCurrentDaewoon(daewoonList, currentYear);
    const adjacentDaewoon = findAdjacentDaewoon(daewoonList, currentDaewoon);
    const currentSewoon = currentDaewoon ? getYearGanji(currentYear) : null;
    const previousDaewoonText = adjacentDaewoon.previous ? formatDaewoon(adjacentDaewoon.previous) : '-';
    const currentDaewoonText = currentDaewoon ? formatDaewoon(currentDaewoon) : '-';
    const nextDaewoonText = adjacentDaewoon.next ? formatDaewoon(adjacentDaewoon.next) : '-';
    const previousDaewoonYearRange = adjacentDaewoon.previous ? formatDaewoonYearRange(adjacentDaewoon.previous) : '-';
    const currentDaewoonYearRange = currentDaewoon ? formatDaewoonYearRange(currentDaewoon) : '-';
    const nextDaewoonYearRange = adjacentDaewoon.next ? formatDaewoonYearRange(adjacentDaewoon.next) : '-';
    const currentSewoonText = currentSewoon ? `${currentSewoon.gan}${currentSewoon.ji}` : '-';
    const baziSummary = [
        `[성별: ${gender}]인 분이 [년주: ${yearPillar} / 월주: ${monthPillar} / 일주: ${dayPillar} / 시주: ${timePillar}] 명식으로 태어났습니다.`,
        currentDaewoon ? `[현재 운 흐름: 이전 대운 ${previousDaewoonText} / 현재 대운 ${currentDaewoonText} / 이후 대운 ${nextDaewoonText} / 현재 세운 ${currentYear}년 ${currentSewoonText}]입니다.` : '',
        currentDaewoon ? `[대운 연도 범위: 이전 ${previousDaewoonYearRange} / 현재 ${currentDaewoonYearRange} / 이후 ${nextDaewoonYearRange}]입니다.` : '',
    ].filter(Boolean).join('\n');

    return {
        gender,
        yearPillar,
        monthPillar,
        dayPillar,
        timePillar,
        currentYear: String(currentYear),
        previousDaewoon: previousDaewoonText,
        previousDaewoonYearRange,
        currentDaewoon: currentDaewoonText,
        currentDaewoonYearRange,
        nextDaewoon: nextDaewoonText,
        nextDaewoonYearRange,
        currentSewoon: currentSewoonText,
        baziSummary,
    };
}

function findCurrentDaewoon(items: NonNullable<BaziResult['daewoon']>['list'], currentYear: number) {
    return items?.find((item) => {
        if (item.start_year === undefined || item.end_year === undefined) return false;
        return item.start_year <= currentYear && currentYear <= item.end_year;
    }) || null;
}

function findAdjacentDaewoon(
    items: NonNullable<BaziResult['daewoon']>['list'],
    currentDaewoon?: NonNullable<BaziResult['daewoon']>['current'],
) {
    if (!currentDaewoon || !items?.length) {
        return { previous: null, next: null };
    }

    const currentIndex = items.findIndex((item) => (
        item.start_year === currentDaewoon.start_year
        && item.end_year === currentDaewoon.end_year
        && item.start_age === currentDaewoon.start_age
        && item.end_age === currentDaewoon.end_age
        && item.gan === currentDaewoon.gan
        && item.ji === currentDaewoon.ji
    ));

    if (currentIndex === -1) {
        return { previous: null, next: null };
    }

    return {
        previous: items[currentIndex - 1] || null,
        next: items[currentIndex + 1] || null,
    };
}

function formatDaewoon(daewoon?: NonNullable<BaziResult['daewoon']>['current']) {
    if (!daewoon) return '-';

    const ganji = `${daewoon.gan || ''}${daewoon.ji || ''}` || '-';
    const yearRange = daewoon.start_year !== undefined && daewoon.end_year !== undefined
        ? `${daewoon.start_year}~${daewoon.end_year}년`
        : '';
    const ageRange = daewoon.start_age !== undefined && daewoon.end_age !== undefined
        ? `${daewoon.start_age}~${daewoon.end_age}세`
        : '';
    const details = [ageRange, yearRange].filter(Boolean).join(', ');

    return details ? `${ganji}(${details})` : ganji;
}

function formatDaewoonYearRange(daewoon?: NonNullable<BaziResult['daewoon']>['current']) {
    if (!daewoon || daewoon.start_year === undefined || daewoon.end_year === undefined) return '-';

    return `${daewoon.start_year}~${daewoon.end_year}년`;
}

function getYearGanji(year: number) {
    const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
    const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
    const offset = year - 1984;
    const stemIndex = ((offset % heavenlyStems.length) + heavenlyStems.length) % heavenlyStems.length;
    const branchIndex = ((offset % earthlyBranches.length) + earthlyBranches.length) % earthlyBranches.length;

    return {
        gan: heavenlyStems[stemIndex],
        ji: earthlyBranches[branchIndex],
    };
}

function formatPillar(pillar?: NonNullable<BaziResult['four_pillars']>[keyof NonNullable<BaziResult['four_pillars']>]) {
    return `${formatStemOrBranch(pillar?.gan)}${formatStemOrBranch(pillar?.ji)}`;
}

function formatStemOrBranch(value?: { kr?: string; ch?: string }) {
    if (!value?.kr && !value?.ch) return '-';
    if (!value.kr) return value.ch || '-';
    if (!value.ch) return value.kr;

    return `${value.kr}(${value.ch})`;
}

function getKstYear() {
    return Number(new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 4));
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value : fallback;
}

function getNumber(value: unknown, fallback: number, min: number, max: number) {
    const number = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

function getInteger(value: unknown, fallback: number, min: number, max: number) {
    return Math.floor(getNumber(value, fallback, min, max));
}

function sanitizeKey(value: string) {
    return value.trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40) || 'step';
}
