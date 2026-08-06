'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Check, ChevronLeft, Compass, LockKeyhole, Sparkles, Trash2, UserRound, X } from 'lucide-react';

import HomeBottomNav from '@/components/home/HomeBottomNav';
import type { BaziResult, PillarKey } from '@/components/bazi/types';

const birthHourOptions = Array.from({ length: 12 }, (_, index) => index);
const birthMinuteOptions = Array.from({ length: 12 }, (_, index) => index * 5);
const pillarOrder: Array<{ key: PillarKey; label: string }> = [
  { key: 'time', label: '시주' },
  { key: 'day', label: '일주' },
  { key: 'month', label: '월주' },
  { key: 'year', label: '년주' },
];

const pillarMeta: Record<PillarKey, { ganTenGodKey?: string; jiTenGodKey: string }> = {
  time: { ganTenGodKey: 'time_gan', jiTenGodKey: 'time_ji' },
  day: { jiTenGodKey: 'day_ji' },
  month: { ganTenGodKey: 'month_gan', jiTenGodKey: 'month_ji' },
  year: { ganTenGodKey: 'year_gan', jiTenGodKey: 'year_ji' },
};

const detailKeyByPillar: Record<PillarKey, 'hour' | 'day' | 'month' | 'year'> = {
  time: 'hour',
  day: 'day',
  month: 'month',
  year: 'year',
};

const elementByChar: Record<string, string> = {
  甲: '목', 乙: '목', 寅: '목', 卯: '목',
  丙: '화', 丁: '화', 巳: '화', 午: '화',
  戊: '토', 己: '토', 辰: '토', 戌: '토', 丑: '토', 未: '토',
  庚: '금', 辛: '금', 申: '금', 酉: '금',
  壬: '수', 癸: '수', 子: '수', 亥: '수',
};

const elementColors: Record<string, { bg: string; hex: string; hanja: string; trait: string }> = {
  목: { bg: 'bg-[#417e50]', hex: '#417e50', hanja: '木', trait: '성장과 추진' },
  화: { bg: 'bg-[#db3c39]', hex: '#db3c39', hanja: '火', trait: '표현과 활력' },
  토: { bg: 'bg-[#c58e49]', hex: '#c58e49', hanja: '土', trait: '안정과 조율' },
  금: { bg: 'bg-[#8f9190]', hex: '#8f9190', hanja: '金', trait: '정리와 판단' },
  수: { bg: 'bg-[#5f9ec1]', hex: '#5f9ec1', hanja: '水', trait: '유연함과 사고' },
};

const hiddenStemsByBranch: Record<string, string[]> = {
  子: ['壬', '癸'],
  丑: ['癸', '辛', '己'],
  寅: ['戊', '丙', '甲'],
  卯: ['甲', '乙'],
  辰: ['乙', '癸', '戊'],
  巳: ['戊', '庚', '丙'],
  午: ['丙', '己', '丁'],
  未: ['丁', '乙', '己'],
  申: ['戊', '壬', '庚'],
  酉: ['庚', '辛'],
  戌: ['辛', '丁', '戊'],
  亥: ['戊', '甲', '壬'],
};

const hiddenStemWeightsByLength: Record<number, number[]> = {
  1: [1],
  2: [0.7, 0.3],
  3: [0.6, 0.3, 0.1],
};

const interactionLabels = [
  { key: 'branch_interactions', label: '지지 작용' },
  { key: 'stem_interactions', label: '천간 작용' },
] as const;

type Preview = {
  name: string;
  relation: string;
  gender: string;
  calendar: string;
  birthDate: string;
  birthTime: string;
  birthParams: NonNullable<BaziResult['birth_params']>;
  baziResult: BaziResult;
};

type FormState = {
  name: string;
  relation: string;
  gender: string;
  calendar: string;
  birthDate: string;
  birthTime: string;
};

type Props = {
  isAuthenticated: boolean;
  initialPeople: SavedPerson[];
};

export type SavedPerson = {
  id: string;
  name: string;
  relation: string;
  gender: string;
  calendar: string;
  birthDate: string;
  birthTime?: string | null;
  birthParams?: BaziResult['birth_params'];
  createdAt?: string;
};

const initialForm: FormState = {
  name: '',
  relation: '나',
  gender: '남성',
  calendar: '양력',
  birthDate: '',
  birthTime: '',
};

function parseBirthDate(value: string) {
  if (!/^\d{8}$/.test(value)) return null;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return { year, month, day, formatted: `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}` };
}

function formatBirthDateInput(value: string) {
  if (value.length <= 4) return value;
  if (value.length <= 6) return `${value.slice(0, 4)}.${value.slice(4)}`;
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

function parseBirthHour(value: string) {
  if (!value) return 0;
  return Number(value.split(':')[0] || 0);
}

function parseBirthMinute(value: string) {
  if (!value) return 0;
  return Number(value.split(':')[1] || 0);
}

function getBirthPeriod(value: string) {
  return parseBirthHour(value) >= 12 ? '오후' : '오전';
}

function getBirthHourOption(value: string) {
  return String(parseBirthHour(value) % 12);
}

function formatBirthTime(value: string) {
  if (!value) return '시간 모름';
  const hour = parseBirthHour(value);
  const minute = parseBirthMinute(value);
  return `${hour >= 12 ? '오후' : '오전'} ${hour % 12}시 ${minute}분`;
}

function buildBirthTime(period: string, hourOption: string, minuteOption: string) {
  const hour = Number(hourOption);
  const minute = Number(minuteOption);
  const normalizedHour = period === '오후' ? hour + 12 : hour;
  return `${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function buildPreview(form: FormState, baziResult: BaziResult, birthParams: NonNullable<BaziResult['birth_params']>): Preview {
  const parsedDate = parseBirthDate(form.birthDate);

  return {
    ...form,
    name: form.name || '이름 미입력',
    birthDate: parsedDate?.formatted || form.birthDate,
    birthTime: formatBirthTime(form.birthTime),
    birthParams,
    baziResult,
  };
}

function getBaziParams(form: FormState) {
  const parsedDate = parseBirthDate(form.birthDate);
  if (!parsedDate) return null;

  const [hour = '00', min = '00'] = (form.birthTime || '00:00').split(':');

  return {
    year: String(parsedDate.year),
    month: String(parsedDate.month),
    day: String(parsedDate.day),
    hour,
    min,
    sl: form.calendar === '음력' ? 'lun' : 'sol',
    gen: form.gender === '여성' ? '여' : '남',
  };
}

function getPillarText(result: BaziResult, key: PillarKey) {
  const pillar = result.four_pillars?.[key];

  return {
    stem: pillar?.gan?.ch || pillar?.gan?.kr || '-',
    branch: pillar?.ji?.ch || pillar?.ji?.kr || '-',
  };
}

function formatCalendarDate(date?: { year?: number; month?: string | number; day?: string | number }) {
  if (!date?.year || !date.month || !date.day) return '-';
  return `${date.year}.${String(date.month).padStart(2, '0')}.${String(date.day).padStart(2, '0')}`;
}

function getPillarDetail(result: BaziResult, key: PillarKey) {
  return result.analysis?.details?.[detailKeyByPillar[key]];
}

function getTenGod(result: BaziResult, key?: string) {
  if (!key) return '';
  return result.ten_gods?.[key] || '';
}

function getStemTenGodLabel(result: BaziResult, key: PillarKey) {
  if (key === 'day') return '일간(나)';
  return getTenGod(result, pillarMeta[key].ganTenGodKey) || '-';
}

function extractHiddenStems(jijanggan?: string[]) {
  if (!jijanggan?.length) return null;

  const stems = jijanggan
    .map((stem) => stem.match(/[甲乙丙丁戊己庚辛壬癸]/)?.[0])
    .filter((stem): stem is string => Boolean(stem));

  return stems.length ? stems : null;
}

function getElementBalance(result: BaziResult) {
  const counts: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const pillars = result.four_pillars;

  if (pillars) {
    pillarOrder.forEach(({ key }) => {
      const ganElement = elementByChar[pillars[key]?.gan?.ch || ''];
      if (ganElement) counts[ganElement] += 1;

      const branchChar = pillars[key]?.ji?.ch || '';
      const hiddenStems = extractHiddenStems(getPillarDetail(result, key)?.branch?.jijanggan) || hiddenStemsByBranch[branchChar] || [];
      const weights = hiddenStemWeightsByLength[hiddenStems.length] || [];

      hiddenStems.forEach((stem, index) => {
        const element = elementByChar[stem];
        if (element) counts[element] += weights[index] || 0;
      });
    });
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0) || 1;

  return Object.entries(counts).map(([element, count]) => {
    const percent = Math.round((count / total) * 100);
    const meta = elementColors[element];

    return {
      element,
      label: `${element}(${meta.hanja})`,
      amount: `${percent}%`,
      width: `${Math.max(percent, 4)}%`,
      value: percent,
      ...meta,
    };
  });
}

function buildConicGradient(elements: ReturnType<typeof getElementBalance>) {
  let start = 0;
  const segments = elements.map((element, index) => {
    const end = index === elements.length - 1 ? 100 : start + element.value;
    const segment = `${element.hex} ${start}% ${end}%`;
    start = end;

    return segment;
  });

  return `conic-gradient(${segments.join(',')})`;
}

function getElementBalanceDescription(elements: ReturnType<typeof getElementBalance>) {
  const strongest = [...elements].sort((a, b) => b.value - a.value)[0];
  const weakest = [...elements].sort((a, b) => a.value - b.value)[0];

  if (!strongest || !weakest) {
    return '천간과 지장간을 함께 보면 오행의 분포를 확인할 수 있어요.';
  }

  return `${strongest.label}의 ${strongest.trait} 기운이 두드러지고, ${weakest.label}의 ${weakest.trait} 감각을 보완하면 균형을 잡는 데 도움이 돼요.`;
}

function getCurrentDaewoon(result: BaziResult) {
  const currentYear = new Date().getFullYear();
  const list = result.daewoon?.list || [];

  return result.daewoon?.current || list.find((item) => {
    if (item.start_year === undefined || item.end_year === undefined) return false;
    return item.start_year <= currentYear && currentYear <= item.end_year;
  });
}

function formatDaewoonRange(item?: NonNullable<BaziResult['daewoon']>['current']) {
  if (!item) return '대운 정보 없음';
  const age = item.start_age !== undefined && item.end_age !== undefined ? `${item.start_age}~${item.end_age}세` : '나이 정보 없음';
  const year = item.start_year !== undefined && item.end_year !== undefined ? `${item.start_year}~${item.end_year}년` : '연도 정보 없음';

  return `${age} · ${year}`;
}

function getInteractionSummary(result: BaziResult) {
  const summary = result.analysis?.summary as Record<string, unknown> | undefined;
  if (!summary) return [];

  return interactionLabels.flatMap((config) => {
    const value = summary[config.key];
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .map((item) => ({ label: config.label, value: item }));
  });
}

function isSavedPerson(value: unknown): value is SavedPerson {
  if (!value || typeof value !== 'object') return false;
  const person = value as Partial<SavedPerson>;
  return Boolean(person.id && person.name && person.relation && person.gender && person.calendar && person.birthDate);
}

function getSavedPersonForm(person: SavedPerson): FormState {
  const params = person.birthParams;
  const birthDate = params?.year && params.month && params.day
    ? `${params.year}${String(params.month).padStart(2, '0')}${String(params.day).padStart(2, '0')}`
    : person.birthDate.replace(/\D/g, '').slice(0, 8);
  const birthTime = params?.hour !== undefined && params.min !== undefined
    ? `${String(params.hour).padStart(2, '0')}:${String(params.min).padStart(2, '0')}`
    : '';

  return {
    name: person.name,
    relation: person.relation,
    gender: person.gender,
    calendar: person.calendar,
    birthDate,
    birthTime,
  };
}

function formatSavedPersonMeta(person: SavedPerson) {
  return `${person.calendar} ${person.birthDate} ${person.birthTime || '시간 모름'} · ${person.gender}`;
}

export default function PeopleClient({ isAuthenticated, initialPeople }: Props) {
  const [activeTab, setActiveTab] = useState('people');
  const [people, setPeople] = useState(initialPeople);
  const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false);
  const [deletingPersonId, setDeletingPersonId] = useState('');
  const [peopleMessageType, setPeopleMessageType] = useState<'success' | 'error'>('success');
  const [peopleMessage, setPeopleMessage] = useState('');
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const isValidBirthDate = useMemo(() => parseBirthDate(form.birthDate) !== null, [form.birthDate]);
  const canPreview = useMemo(() => form.name.trim().length > 0 && isValidBirthDate, [form.name, isValidBirthDate]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateBirthDate = (value: string) => {
    updateField('birthDate', value.replace(/\D/g, '').slice(0, 8));
  };

  const updateBirthPeriod = (period: string) => {
    updateField('birthTime', buildBirthTime(period, getBirthHourOption(form.birthTime), String(parseBirthMinute(form.birthTime))));
  };

  const updateBirthHour = (hour: string) => {
    updateField('birthTime', buildBirthTime(getBirthPeriod(form.birthTime), hour, String(parseBirthMinute(form.birthTime))));
  };

  const updateBirthMinute = (minute: string) => {
    updateField('birthTime', buildBirthTime(getBirthPeriod(form.birthTime), getBirthHourOption(form.birthTime), minute));
  };

  const loadSavedPerson = (person: SavedPerson) => {
    setForm(getSavedPersonForm(person));
    setPreview(null);
    setErrorMessage('');
    setSaveStatus('idle');
    setSaveMessage('');
    setPeopleMessage('');
    setIsPeopleModalOpen(false);
  };

  const handleDeletePerson = async (person: SavedPerson) => {
    if (deletingPersonId) return;

    const confirmed = window.confirm(`${person.name}님의 저장된 인물 정보를 삭제할까요?`);
    if (!confirmed) return;

    setDeletingPersonId(person.id);
    setPeopleMessageType('success');
    setPeopleMessage('');

    try {
      const response = await fetch(`/api/people?id=${encodeURIComponent(person.id)}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '인물 정보 삭제에 실패했습니다.');
      }

      setPeople((current) => current.filter((item) => item.id !== person.id));
      setPeopleMessageType('success');
      setPeopleMessage(data.message || '인물 정보를 삭제했습니다.');
    } catch (error) {
      setPeopleMessageType('error');
      setPeopleMessage(error instanceof Error ? error.message : '인물 정보 삭제에 실패했습니다.');
    } finally {
      setDeletingPersonId('');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPreview) return;

    const baziParams = getBaziParams(form);
    if (!baziParams) return;

    setIsLoading(true);
    setErrorMessage('');
    setSaveStatus('idle');
    setSaveMessage('');

    try {
      const searchParams = new URLSearchParams(baziParams);
      const response = await fetch(`/api/bazi/preview?${searchParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '사주 정보를 불러오지 못했습니다.');
      }

      setPreview(buildPreview(form, data as BaziResult, baziParams));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '사주 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePerson = async () => {
    if (!preview || saveStatus === 'saving' || saveStatus === 'saved') return;

    setSaveStatus('saving');
    setSaveMessage('');

    try {
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: preview.name,
          relation: preview.relation,
          gender: preview.gender,
          calendar: preview.calendar,
          birthDate: preview.birthDate,
          birthTime: preview.birthTime,
          birthParams: preview.birthParams,
          baziResult: preview.baziResult,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '인물 정보 저장에 실패했습니다.');
      }

      setSaveStatus('saved');
      setSaveMessage(data.message || '인물 정보를 저장했습니다.');
      if (isSavedPerson(data.person)) {
        setPeople((current) => [data.person, ...current.filter((person) => person.id !== data.person.id)]);
      }
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : '인물 정보 저장에 실패했습니다.');
    }
  };

  return (
    <div className="flex min-h-screen w-full justify-center bg-[#FEFAF5] text-[#121225]">
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-[#FEFAF5] shadow-[0_0_45px_rgba(47,34,17,0.12)]">
        <main className="flex-1 px-6 pb-28 pt-6">
          <header className="flex h-12 items-center justify-between">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full text-[#171553]">
              <ChevronLeft className="h-7 w-7" strokeWidth={2.2} />
            </Link>
            <h1 className="text-[18px] font-semibold text-[#111111]">인물 등록</h1>
            <span className="h-10 w-10" />
          </header>

          <section className="mt-5 rounded-[12px] border border-[#ead8c6] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(92,61,25,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-semibold text-[#111111]">
                  저장된 인물 {isAuthenticated ? `${people.length}명` : ''}
                </h2>
                <p className="mt-0.5 truncate text-[12px] text-[#777777]">
                  {isAuthenticated ? '저장한 인물 정보를 불러올 수 있어요' : '로그인 후 저장 목록을 볼 수 있어요'}
                </p>
              </div>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setPeopleMessage('');
                    setIsPeopleModalOpen(true);
                  }}
                  disabled={people.length === 0}
                  className="font-display flex h-10 shrink-0 items-center justify-center rounded-[9px] border border-[#191450] bg-white px-4 text-[13px] font-medium text-[#191450] transition hover:bg-[#FEFAF5] disabled:cursor-not-allowed disabled:border-[#d8cec4] disabled:text-[#9a9088]"
                >
                  불러오기
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  className="font-display flex h-10 shrink-0 items-center justify-center rounded-[9px] bg-[#191450] px-4 text-[13px] font-medium text-white"
                >
                  로그인
                </Link>
              )}
            </div>
          </section>

          {isPeopleModalOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4" role="dialog" aria-modal="true" aria-labelledby="saved-people-title">
              <div className="flex max-h-[calc(100vh-48px)] w-full max-w-[390px] flex-col overflow-hidden rounded-[12px] border border-[#ead8c6] bg-[#fffdf9] shadow-[0_24px_70px_rgba(24,17,11,0.28)]">
                <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[#eadfd4] px-5 py-4">
                  <div>
                    <h3 id="saved-people-title" className="text-[18px] font-semibold text-[#171553]">저장된 인물 불러오기</h3>
                    <p className="mt-1 text-[12px] text-[#73675c]">선택한 인물 정보가 입력 폼에 채워집니다.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPeopleModalOpen(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#7b6a5a] transition hover:bg-[#f6eee5]"
                    aria-label="닫기"
                  >
                    <X className="h-5 w-5" strokeWidth={2} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  {peopleMessage && (
                    <p className={`mb-3 rounded-[8px] px-3 py-2 text-[12px] leading-[1.55] ${peopleMessageType === 'success'
                      ? 'bg-[#eef8ef] text-[#357247]'
                      : 'bg-[#fff2ec] text-[#a05738]'
                      }`}>
                      {peopleMessage}
                    </p>
                  )}
                  {people.length > 0 ? (
                    <div className="space-y-2">
                      {people.map((person) => {
                        const isCurrentForm = form.name === person.name && form.relation === person.relation;
                        const isDeleting = deletingPersonId === person.id;

                        return (
                          <div key={person.id} className="flex min-h-[72px] items-center gap-2 rounded-[10px] border border-[#efe2d4] bg-white px-3 py-3 transition hover:border-[#dfc5aa] hover:bg-[#fff8f0]">
                            <button
                              type="button"
                              onClick={() => loadSavedPerson(person)}
                              disabled={Boolean(deletingPersonId)}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-wait disabled:opacity-60"
                            >
                              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isCurrentForm ? 'bg-[#191450] text-white' : 'bg-[#f1e6db] text-[#7d5a36]'}`}>
                                {isCurrentForm ? <Check className="h-5 w-5" strokeWidth={2.3} /> : <UserRound className="h-5 w-5" strokeWidth={1.8} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[15px] font-semibold text-[#171553]">
                                  {person.name} · {person.relation}
                                </span>
                                <span className="mt-0.5 block truncate text-[12px] leading-5 text-[#555555]">
                                  {formatSavedPersonMeta(person)}
                                </span>
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePerson(person)}
                              disabled={Boolean(deletingPersonId)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[#a05738] transition hover:bg-[#fff2ec] disabled:cursor-wait disabled:opacity-50"
                              aria-label={`${person.name} 삭제`}
                            >
                              {isDeleting ? (
                                <span className="text-[11px] font-semibold">...</span>
                              ) : (
                                <Trash2 className="h-4 w-4" strokeWidth={2} />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[10px] border border-dashed border-[#e5d2bd] bg-white px-4 py-8 text-center">
                      <UserRound className="mx-auto h-7 w-7 text-[#b06b16]" strokeWidth={1.7} />
                      <p className="mt-2 break-keep text-[13px] leading-[1.65] text-[#555555]">저장된 인물이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form id="person-form" onSubmit={handleSubmit} className="mt-5 space-y-4 scroll-mt-6">
            <label className="block">
              <span className="mb-2 block text-[14px] font-medium text-[#222222]">이름</span>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="예: 김명리"
                className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-4 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-[14px] font-medium text-[#222222]">관계</span>
                <select
                  value={form.relation}
                  onChange={(event) => updateField('relation', event.target.value)}
                  className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-3 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
                >
                  <option>나</option>
                  <option>배우자</option>
                  <option>가족</option>
                  <option>친구</option>
                  <option>기타</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-medium text-[#222222]">성별</span>
                <select
                  value={form.gender}
                  onChange={(event) => updateField('gender', event.target.value)}
                  className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-3 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
                >
                  <option>남성</option>
                  <option>여성</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-[0.75fr_1.25fr] gap-3">
              <label className="block">
                <span className="mb-2 block text-[14px] font-medium text-[#222222]">달력</span>
                <select
                  value={form.calendar}
                  onChange={(event) => updateField('calendar', event.target.value)}
                  className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-3 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
                >
                  <option>양력</option>
                  <option>음력</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[14px] font-medium text-[#222222]">생년월일</span>
                <input
                  inputMode="numeric"
                  value={formatBirthDateInput(form.birthDate)}
                  onChange={(event) => updateBirthDate(event.target.value)}
                  placeholder="예: 2026.01.08"
                  maxLength={10}
                  className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-3 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
                />
                {form.birthDate.length > 0 && !isValidBirthDate && (
                  <span className="mt-1.5 block text-[12px] text-[#d14b4b]">생년월일 8자리를 정확히 입력해주세요.</span>
                )}
              </label>
            </div>

            <div className="block">
              <span className="mb-2 block text-[14px] font-medium text-[#222222]">태어난 시간</span>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={getBirthPeriod(form.birthTime)}
                  onChange={(event) => updateBirthPeriod(event.target.value)}
                  className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-3 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
                >
                  <option>오전</option>
                  <option>오후</option>
                </select>

                <select
                  value={getBirthHourOption(form.birthTime)}
                  onChange={(event) => updateBirthHour(event.target.value)}
                  className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-3 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
                >
                  {birthHourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}시
                    </option>
                  ))}
                </select>

                <select
                  value={parseBirthMinute(form.birthTime)}
                  onChange={(event) => updateBirthMinute(event.target.value)}
                  className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-3 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
                >
                  {birthMinuteOptions.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}분
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canPreview || isLoading}
              className="font-display flex h-12 w-full cursor-pointer items-center justify-center rounded-[10px] bg-[#191450] text-[15px] font-medium tracking-[0.01em] text-white transition-colors hover:bg-[#24206a] disabled:cursor-not-allowed disabled:bg-[#cfc8bd]"
            >
              {isLoading ? '확인 중...' : '확인하기'}
            </button>
            {errorMessage && <p className="text-[13px] leading-[1.6] text-[#d14b4b]">{errorMessage}</p>}
          </form>

          {preview && (
            <section className="mt-6 overflow-hidden rounded-[12px] border border-[#ead8c6] bg-white shadow-[0_16px_38px_rgba(58,42,29,0.08)]">
              <header className="border-b border-[#eadfd4] bg-[#fffaf4] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#b06b16]">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
                      명식 리포트
                    </p>
                    <h2 className="mt-1 text-[19px] font-semibold text-[#171553]">사주 정보 미리보기</h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#e5d2bd] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#7d5a36]">
                    {preview.relation}
                  </span>
                </div>

                <div className="mt-3 rounded-[8px] border border-[#efe2d4] bg-white px-3 py-3 text-[13px] leading-[1.7] text-[#555555]">
                  <p className="font-semibold text-[#2a2018]">
                    {preview.name} · {preview.gender}
                  </p>
                  <p>
                    {preview.calendar} {preview.birthDate} {preview.birthTime}
                  </p>
                  <p>
                    양력 {formatCalendarDate(preview.baziResult.calendar?.solar)} · 음력 {formatCalendarDate(preview.baziResult.calendar?.lunar)}
                  </p>
                </div>
              </header>

              <div className="space-y-4 px-4 py-4">
                <section>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#b06b16]" strokeWidth={2} />
                    <h3 className="text-[15px] font-semibold text-[#2a2018]">사주 정국</h3>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-[8px] border border-[#eadfd4] bg-[#fffaf4]">
                    <div className="grid grid-cols-4 border-b border-[#eadfd4] text-center">
                      {pillarOrder.map((pillar) => (
                        <div key={pillar.key} className="min-w-0 border-r border-[#eadfd4] px-1 py-2.5 last:border-r-0">
                          <p className="text-[12px] font-semibold text-[#65574b]">{pillar.label}</p>
                          <p className="mt-1 min-h-4 break-keep text-[11px] leading-4 text-[#9d7750]">
                            {getStemTenGodLabel(preview.baziResult, pillar.key)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-4 text-center">
                      {pillarOrder.map((pillar) => {
                        const pillarText = getPillarText(preview.baziResult, pillar.key);
                        const detail = getPillarDetail(preview.baziResult, pillar.key);
                        const hiddenStems = detail?.branch?.jijanggan?.join(', ') || '없음';

                        return (
                          <article key={pillar.key} className="min-w-0 border-r border-[#eadfd4] last:border-r-0">
                            <div className="border-b border-[#eadfd4] py-3">
                              <p className="text-[29px] font-semibold leading-none text-[#171553]">{pillarText.stem}</p>
                            </div>
                            <div className="border-b border-[#eadfd4] py-3">
                              <p className="text-[29px] font-semibold leading-none text-[#171553]">{pillarText.branch}</p>
                            </div>
                            <p className="border-b border-[#eadfd4] px-1 py-2 text-[11px] leading-4 text-[#8a6245]">
                              {getTenGod(preview.baziResult, pillarMeta[pillar.key].jiTenGodKey) || '-'}
                            </p>
                            <p className="min-h-12 break-keep px-1.5 py-2 text-[11px] leading-4 text-[#74675b]">{hiddenStems}</p>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {(() => {
                  const elements = getElementBalance(preview.baziResult);
                  const strongest = [...elements].sort((a, b) => b.value - a.value)[0];

                  return (
                    <section className="rounded-[10px] border border-[#eee2d6] bg-[#fffdf9] px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Compass className="h-4 w-4 text-[#b06b16]" strokeWidth={2} />
                        <h3 className="text-[15px] font-semibold text-[#2a2018]">오행 균형</h3>
                      </div>

                      <div className="mt-4 grid grid-cols-[116px_1fr] items-center gap-4">
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-full" style={{ background: buildConicGradient(elements) }}>
                          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[#fffaf4] text-center shadow-inner">
                            <strong className="text-[26px] leading-none text-[#171553]">{strongest?.element || '-'}</strong>
                            <span className="mt-1 text-[13px] font-semibold text-[#4d4135]">{strongest?.amount || '-'}</span>
                          </div>
                        </div>

                        <div className="min-w-0 space-y-2">
                          {elements.map((element) => (
                            <div key={element.label} className="grid grid-cols-[40px_1fr_34px] items-center gap-2 text-[12px]">
                              <span className="text-[#493c31]">{element.label}</span>
                              <span className="h-2 overflow-hidden rounded-full bg-[#efe8df]">
                                <span className={`block h-full rounded-full ${element.bg}`} style={{ width: element.width }} />
                              </span>
                              <span className="text-right font-semibold text-[#342a22]">{element.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="mt-3 break-keep rounded-[8px] bg-[#fbf5ef] px-3 py-3 text-[12px] leading-[1.65] text-[#594b3f]">
                        {getElementBalanceDescription(elements)}
                      </p>
                    </section>
                  );
                })()}

                <section className="grid grid-cols-1 gap-3">
                  {(() => {
                    const currentDaewoon = getCurrentDaewoon(preview.baziResult);
                    const interactionSummary = getInteractionSummary(preview.baziResult).slice(0, 3);

                    return (
                      <>
                        <article className="rounded-[10px] border border-[#eee2d6] bg-[#fffdf9] px-4 py-4">
                          <p className="text-[12px] font-semibold text-[#b06b16]">대운 흐름</p>
                          <h3 className="mt-1 text-[16px] font-semibold text-[#2a2018]">
                            {currentDaewoon ? `${currentDaewoon.gan || ''}${currentDaewoon.ji || ''} 대운` : '대운 시작 전'}
                          </h3>
                          <p className="mt-2 text-[13px] leading-[1.65] text-[#66594d]">
                            {preview.baziResult.daewoon?.direction || '-'} · {formatDaewoonRange(currentDaewoon)}
                          </p>
                        </article>

                        <article className="rounded-[10px] border border-[#eee2d6] bg-[#fffdf9] px-4 py-4">
                          <p className="text-[12px] font-semibold text-[#b06b16]">합·충 요약</p>
                          {interactionSummary.length > 0 ? (
                            <dl className="mt-2 space-y-1.5">
                              {interactionSummary.map((item) => (
                                <div key={`${item.label}-${item.value}`} className="break-keep text-[13px] leading-[1.55] text-[#4f4033]">
                                  <dt className="inline font-semibold text-[#33281f]">{item.label}</dt>
                                  <dd className="inline"> · {item.value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <p className="mt-2 break-keep text-[13px] leading-[1.65] text-[#66584c]">
                              표시된 기본 합충 작용이 없습니다. 오행 균형과 십성 배치를 중심으로 살펴보면 좋아요.
                            </p>
                          )}
                        </article>
                      </>
                    );
                  })()}
                </section>

                <section className="rounded-[10px] bg-[#FEFAF5] px-4 py-4">
                  <div className="flex items-start gap-2">
                    <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#b06b16]" strokeWidth={2} />
                    <p className="text-[13px] leading-[1.65] text-[#444444]">
                      {isAuthenticated
                        ? '입력한 사주 정보를 저장하거나 기본 상담으로 이어갈 수 있어요.'
                        : 'AI 사주 상담, 결과 저장, 인물 관리는 로그인 후 이용할 수 있어요.'}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {isAuthenticated ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSavePerson}
                          disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                          className="font-display flex h-11 cursor-pointer items-center justify-center rounded-[9px] border border-[#191450] bg-white text-[14px] font-medium tracking-[0.01em] text-[#191450] transition-colors hover:bg-[#FEFAF5] disabled:cursor-not-allowed disabled:border-[#cfc8bd] disabled:bg-[#f4eee7] disabled:text-[#8b8178]"
                        >
                          {saveStatus === 'saving' ? '저장 중' : saveStatus === 'saved' ? '저장 완료' : '저장하기'}
                        </button>
                        <button
                          type="button"
                          onClick={() => alert('사주 기본 상담 기능을 준비 중입니다.')}
                          className="font-display flex h-11 cursor-pointer items-center justify-center rounded-[9px] bg-[#191450] text-[14px] font-medium tracking-[0.01em] text-white transition-colors hover:bg-[#24206a]"
                        >
                          기본 상담
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/signin"
                          className="font-display flex h-11 cursor-pointer items-center justify-center rounded-[9px] border border-[#191450] bg-white text-[14px] font-medium tracking-[0.01em] text-[#191450] transition-colors hover:bg-[#FEFAF5]"
                        >
                          저장하기
                        </Link>
                        <Link
                          href="/auth/signin"
                          className="font-display flex h-11 cursor-pointer items-center justify-center rounded-[9px] bg-[#191450] text-[14px] font-medium tracking-[0.01em] text-white transition-colors hover:bg-[#24206a]"
                        >
                          기본 상담
                        </Link>
                      </>
                    )}
                  </div>
                  {saveMessage && (
                    <p className={`mt-3 rounded-[8px] px-3 py-2 text-[12px] leading-[1.55] ${saveStatus === 'error'
                      ? 'bg-[#fff2ec] text-[#a05738]'
                      : 'bg-[#eef8ef] text-[#357247]'
                      }`}>
                      {saveMessage}
                    </p>
                  )}
                </section>
              </div>
            </section>
          )}
        </main>

        <HomeBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
