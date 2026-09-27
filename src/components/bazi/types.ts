export type PillarKey = 'time' | 'day' | 'month' | 'year';
export type PillarDetailKey = PillarKey | 'hour';
export type BaziAuthStatus = 'checking' | 'guest' | 'member';

export type BaziSubject = {
    name?: string | null;
};

export type StemDetail = {
    kr?: string;
    ch?: string;
    element?: string;
    element_ch?: string;
    yin_yang?: string;
    color?: string;
    ten_god?: string;
};

export type BranchDetail = {
    kr?: string;
    ch?: string;
    element?: string;
    element_ch?: string;
    yin_yang?: string;
    color?: string;
    ten_god?: string;
};

export type JijangganDetail = {
    kr?: string;
    ch?: string;
    element?: string;
    element_ch?: string;
    yin_yang?: string;
    color?: string;
    ten_god?: string;
    type?: string;
    ratio?: string | null;
};

export type BaziPillarItem = {
    gan?: StemDetail;
    ji?: BranchDetail;
    unseong?: string | null;
    unseong_self?: string | null;
    jijanggan?: JijangganDetail[];
    special_stars?: string[];
};

export type BaziResult = {
    calendar?: {
        solar?: { year?: number; month?: string | number; day?: string | number };
        lunar?: { year?: number; month?: string | number; day?: string | number };
        solar_plan?: string | null;
        lunar_plan?: string | null;
    };
    four_pillars?: Partial<Record<PillarDetailKey, BaziPillarItem>>;
    ten_gods?: Record<string, string | undefined>;
    daewoon?: {
        direction?: string;
        start_age?: number;
        current?: DaewoonItem | null;
        list?: DaewoonItem[];
    };
    cycles?: {
        future_100?: Array<CycleItem | [number, string, string] | Array<[number, string, string]>>;
        baby_10?: Array<CycleItem | [number, string, string]>;
    };
    meta?: {
        gender?: string;
        ddi?: string | null;
        birth_date_solar?: string | null;
        birth_time?: string | null;
        age_man?: number | null;
        age_korean?: number | null;
        birth_weekday?: string | null;
    };
    birth_params?: {
        year: string;
        month: string;
        day: string;
        hour: string;
        min: string;
        sl: string;
        gen: string;
    };
    analysis?: {
        summary?: {
            branch_interactions?: string[];
            stem_interactions?: string[];
            total_energy_balance?: string;
        };
        details?: Partial<Record<PillarDetailKey, PillarDetail>>;
    };
    advanced_analysis?: {
        five_elements?: {
            counts?: Record<string, number>;
            percentages?: Record<string, number>;
            scores?: Record<string, number>;
            dominant?: string[];
            deficient?: string[];
            summary?: string;
        } | null;
        special_stars?: Array<{
            name: string;
            pillar: string;
            position: string;
            char: string;
            type: string;
            description: string;
        }> | null;
        special_stars_by_pillar?: Record<string, string[]> | null;
        interactions?: {
            summary_list?: string[];
            matrix?: Array<{
                category: string;
                type: string;
                name: string;
                from_pillar: string;
                to_pillar: string;
                is_adjacent: boolean;
                weight: number;
                score: number;
                transformed_element?: string | null;
                description: string;
            }>;
            tension_score?: number;
            harmony_score?: number;
            climate?: string;
        } | null;
        xu_shi_dynamics?: {
            pillars?: Record<string, unknown>;
            real_count?: number;
            transformed_empty_count?: number;
            hollow_penetrate_count?: number;
            overall_status?: string;
        } | null;
        ai_consultation_prompts?: string[];
    } | null;
};

export type CycleItem = {
    year?: number;
    age?: number;
    gan?: StemDetail;
    ji?: BranchDetail;
    unseong?: string | null;
};

export type PillarDetail = {
    stem?: {
        char?: string;
        score?: number;
        status?: string;
        unseong?: string;
        root_info?: RootInfo[];
    };
    branch?: {
        char?: string;
        jijanggan?: string[];
        transmitted?: StemInfo[];
        hidden?: StemInfo[];
    };
    jahab?: {
        exists?: boolean;
        active?: boolean;
        combined_element?: string;
    } | null;
};

export type RootInfo = {
    branch_char?: string;
    position?: string;
    ten_star?: string;
    score?: number;
};

export type StemInfo = {
    stem?: string;
    stem_pos?: string;
    stem_ten_star?: string;
};

export type DaewoonItem = {
    index?: number;
    start_age?: number;
    end_age?: number;
    start_year?: number;
    end_year?: number;
    gan?: string;
    ji?: string;
    year?: number;
    age?: number;
    gan_detail?: StemDetail | null;
    ji_detail?: BranchDetail | null;
    gan_ten_god?: string | null;
    ji_ten_god?: string | null;
    unseong?: string | null;
};
