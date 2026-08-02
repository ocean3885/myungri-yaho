/**
 * 간이 만세력 및 오행 관계를 기반으로 오늘의 운세를 동적으로 연산하는 라이브러리
 */

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const HEAVENLY_STEM_ELEMENTS: Record<string, '木' | '火' | '土' | '金' | '水'> = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
};

type TenGodRelation = '비겁' | '식상' | '재성' | '관성' | '인성';

function getTenGodRelation(userStem: string, todayStem: string): TenGodRelation {
    const userElement = HEAVENLY_STEM_ELEMENTS[userStem];
    const todayElement = HEAVENLY_STEM_ELEMENTS[todayStem];

    if (!userElement || !todayElement) return '비겁';

    const elements = ['木', '火', '土', '金', '水'] as const;
    const userIdx = elements.indexOf(userElement);
    const todayIdx = elements.indexOf(todayElement);

    const diff = (todayIdx - userIdx + 5) % 5;

    switch (diff) {
        case 0: return '비겁';
        case 1: return '식상';
        case 2: return '재성';
        case 3: return '관성';
        case 4: return '인성';
        default: return '비겁';
    }
}

function getTodayStem(): string {
    const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const daysSinceEpoch = Math.floor(kstNow.getTime() / (24 * 60 * 60 * 1000));
    const index = (daysSinceEpoch % 10 + 10) % 10;
    return HEAVENLY_STEMS[index];
}

function getUserVirtualStem(userKey: string): string {
    let hash = 0;
    for (let i = 0; i < userKey.length; i++) {
        hash = userKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % 10;
    return HEAVENLY_STEMS[index];
}

export function calculateDailyFortune(userKey: string) {
    const userStem = getUserVirtualStem(userKey);
    const todayStem = getTodayStem();
    const relation = getTenGodRelation(userStem, todayStem);

    let score = 80;
    let wealth = 80;
    let relationScore = 80;
    let healthScore = 80;
    let phrase = '무난하고 평온한 하루입니다.';

    switch (relation) {
        case '비겁':
            score = 75;
            wealth = 70;
            relationScore = 85;
            healthScore = 80;
            phrase = `오늘의 일진은 본인과 기운이 같은 ${todayStem} 기운의 날입니다. 주관이 뚜렷해지고 동료와의 유대가 끈끈해지지만 불필요한 고집은 피하세요.`;
            break;
        case '식상':
            score = 88;
            wealth = 75;
            relationScore = 90;
            healthScore = 78;
            phrase = `오늘의 일진은 재능을 널리 알리는 ${todayStem} 기운의 날입니다. 창의적인 아이디어가 샘솟고 표현력이 극대화되니 마음먹은 일을 행동에 옮겨보세요.`;
            break;
        case '재성':
            score = 85;
            wealth = 92;
            relationScore = 78;
            healthScore = 75;
            phrase = `오늘의 일진은 소중한 결실을 거두는 ${todayStem} 기운의 날입니다. 투자나 거래 등의 결정에서 재물운이 크게 상승하나, 과욕은 금물입니다.`;
            break;
        case '관성':
            score = 65;
            wealth = 60;
            relationScore = 70;
            healthScore = 68;
            phrase = `오늘의 일진은 나를 통제하고 관리하는 ${todayStem} 기운의 날입니다. 생각을 바로 행동으로 옮기기보다 차근차근 점검하는 것이 이롭습니다.`;
            break;
        case '인성':
            score = 90;
            wealth = 80;
            relationScore = 88;
            healthScore = 85;
            phrase = `오늘의 일진은 든든한 학업과 지원의 ${todayStem} 기운의 날입니다. 계약이나 합의 운이 좋고 주변 사람의 따뜻한 조언이 안정감을 선사합니다.`;
            break;
    }

    const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const dayOfWeek = kstNow.getDay();
    score = Math.min(100, Math.max(40, score + (dayOfWeek % 5) - 2));
    wealth = Math.min(100, Math.max(40, wealth + ((dayOfWeek + 1) % 5) - 2));
    relationScore = Math.min(100, Math.max(40, relationScore + ((dayOfWeek + 2) % 5) - 2));
    healthScore = Math.min(100, Math.max(40, healthScore + ((dayOfWeek + 3) % 5) - 2));

    return {
        score,
        wealth,
        relation: relationScore,
        health: healthScore,
        phrase,
    };
}
