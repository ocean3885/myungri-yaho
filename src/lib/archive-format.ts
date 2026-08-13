export function getConsultationTitle(promptVersion?: string | null, consultationTypeKey?: string | null) {
    if (consultationTypeKey === 'free_basic') return '기본 사주 상담';
    if (!promptVersion) return consultationTypeKey ? formatConsultationTypeKey(consultationTypeKey) : '기본 사주 상담';

    const normalized = promptVersion.replace(/-v\d+$/i, '').replace(/_/g, ' ');
    if (normalized.includes('free') && normalized.includes('basic')) return '기본 사주 상담';

    return normalized || '사주 상담';
}

function formatConsultationTypeKey(value: string) {
    return value.replace(/_/g, ' ') || '사주 상담';
}

export function getStatusLabel(status?: string | null) {
    if (status === 'completed') return '완료';
    if (status === 'failed') return '실패';
    return '분석 중';
}

export function getStatusClassName(status?: string | null) {
    if (status === 'completed') return 'border-[#cfe7d2] bg-[#eef8ef] text-[#357247]';
    if (status === 'failed') return 'border-[#ffd9c8] bg-[#fff2ec] text-[#a05738]';
    return 'border-[#ead8c6] bg-[#fff8ec] text-[#9a6616]';
}

export function formatKstDate(value?: string | null) {
    if (!value) return '-';

    const date = new Date(value.includes('T') ? value : `${value}T00:00:00+09:00`);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Seoul',
    }).format(date);
}

export function formatKstDateTime(value?: string | null) {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul',
    }).format(date);
}

export function getResultPreview(text?: string | null) {
    const normalized = text?.replace(/\s+/g, ' ').trim();
    if (!normalized) return '상담 결과가 준비되면 이곳에 표시됩니다.';

    return normalized.length > 92 ? `${normalized.slice(0, 92)}...` : normalized;
}
