import {
    DEFAULT_BAZI_CONSULTATION_TYPE,
    DEFAULT_BAZI_PROMPT_SETTING_KEY,
    getBaziPromptSettingKey,
    normalizeBaziConsultationType,
} from '@/lib/bazi-prompt-config';

export type ConsultationType = {
    id?: string;
    key: string;
    name: string;
    description: string | null;
    promptSettingKey: string;
    enabled: boolean;
    sortOrder: number;
    priceKrw: number;
    subjectCount: number;
    createdAt?: string | null;
    updatedAt?: string | null;
};

type ConsultationTypesQueryClient = {
    from: (table: 'consultation_types') => {
        select: (columns: string) => {
            eq: (column: string, value: string | boolean) => {
                maybeSingle: () => Promise<ConsultationTypeSingleResult>;
                order: (column: string, options: { ascending: boolean }) => {
                    order: (column: string, options: { ascending: boolean }) => Promise<ConsultationTypeListResult>;
                };
            };
            order: (column: string, options: { ascending: boolean }) => {
                order: (column: string, options: { ascending: boolean }) => Promise<ConsultationTypeListResult>;
            };
        };
    };
};

type ConsultationTypeRow = {
    id?: string;
    key: string;
    name?: string | null;
    description?: string | null;
    prompt_setting_key?: string | null;
    enabled?: boolean | null;
    sort_order?: number | null;
    price_krw?: number | null;
    subject_count?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type ConsultationTypeSingleResult = {
    data: ConsultationTypeRow | null;
    error: { message?: string } | null;
};

type ConsultationTypeListResult = {
    data: ConsultationTypeRow[] | null;
    error: { message?: string } | null;
};

export function getDefaultConsultationType(): ConsultationType {
    return {
        key: DEFAULT_BAZI_CONSULTATION_TYPE,
        name: '기본 상담',
        description: '사주 원국을 바탕으로 기본 성향과 현재 운 흐름을 해석합니다.',
        promptSettingKey: DEFAULT_BAZI_PROMPT_SETTING_KEY,
        enabled: true,
        sortOrder: 10,
        priceKrw: 990,
        subjectCount: 1,
    };
}

export async function getConsultationTypeByKey(adminSupabase: unknown, key?: string) {
    const normalizedKey = normalizeBaziConsultationType(key || DEFAULT_BAZI_CONSULTATION_TYPE);
    const client = adminSupabase as ConsultationTypesQueryClient;
    const { data, error } = await client
        .from('consultation_types')
        .select('id, key, name, description, prompt_setting_key, enabled, sort_order, price_krw, subject_count, created_at, updated_at')
        .eq('key', normalizedKey)
        .maybeSingle();

    if (error) {
        console.error('Consultation type query error:', error);
        return normalizedKey === DEFAULT_BAZI_CONSULTATION_TYPE
            ? getDefaultConsultationType()
            : {
                ...getDefaultConsultationType(),
                key: normalizedKey,
                name: normalizedKey,
                promptSettingKey: getBaziPromptSettingKey(normalizedKey),
            };
    }

    return data ? mapConsultationTypeRow(data) : {
        ...getDefaultConsultationType(),
        key: normalizedKey,
        name: normalizedKey === DEFAULT_BAZI_CONSULTATION_TYPE ? '기본 상담' : normalizedKey,
        promptSettingKey: getBaziPromptSettingKey(normalizedKey),
    };
}

export async function listConsultationTypes(adminSupabase: unknown, onlyEnabled = false) {
    const client = adminSupabase as ConsultationTypesQueryClient;
    const query = client
        .from('consultation_types')
        .select('id, key, name, description, prompt_setting_key, enabled, sort_order, price_krw, subject_count, created_at, updated_at');
    const result = onlyEnabled
        ? await query.eq('enabled', true).order('sort_order', { ascending: true }).order('key', { ascending: true })
        : await query.order('sort_order', { ascending: true }).order('key', { ascending: true });

    if (result.error) {
        console.error('Consultation types list query error:', result.error);
        return [getDefaultConsultationType()];
    }

    const types = (result.data || []).map(mapConsultationTypeRow);
    return types.length > 0 ? types : [getDefaultConsultationType()];
}

function mapConsultationTypeRow(row: ConsultationTypeRow): ConsultationType {
    const key = normalizeBaziConsultationType(row.key);

    return {
        id: row.id,
        key,
        name: row.name?.trim() || (key === DEFAULT_BAZI_CONSULTATION_TYPE ? '기본 상담' : key),
        description: row.description || null,
        promptSettingKey: row.prompt_setting_key || getBaziPromptSettingKey(key),
        enabled: row.enabled !== false,
        sortOrder: row.sort_order ?? 100,
        priceKrw: row.price_krw ?? 990,
        subjectCount: Math.min(4, Math.max(1, row.subject_count ?? 1)),
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
    };
}
