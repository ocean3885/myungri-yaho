export type PillarKey = 'time' | 'day' | 'month' | 'year';
export type PillarDetailKey = PillarKey | 'hour';
export type BaziAuthStatus = 'checking' | 'guest' | 'member';

export type BaziSubject = {
    name?: string | null;
};

export type BaziResult = {
    calendar?: {
        solar?: { year?: number; month?: string | number; day?: string | number };
        lunar?: { year?: number; month?: string | number; day?: string | number };
    };
    four_pillars?: Record<PillarKey, {
        gan?: { kr?: string; ch?: string };
        ji?: { kr?: string; ch?: string };
    }>;
    ten_gods?: Record<string, string | undefined>;
    daewoon?: {
        direction?: string;
        start_age?: number;
        current?: DaewoonItem | null;
        list?: DaewoonItem[];
    };
    cycles?: {
        future_100?: Array<Array<[number, string, string]>>;
        baby_10?: Array<[number, string, string]>;
    };
    meta?: { gender?: string; ddi?: string };
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
};
