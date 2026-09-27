'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronLeft, Compass, MessagesSquare, UserPlus } from 'lucide-react';

import type { BaziResult, PillarKey } from '@/components/bazi/types';
import BaziPillarsTable from '@/components/bazi/BaziPillarsTable';

const birthHourOptions = Array.from({ length: 24 }, (_, index) => index);
const birthMinuteOptions = Array.from({ length: 12 }, (_, index) => index * 5);
const pillarOrder: Array<{ key: PillarKey; label: string }> = [
  { key: 'time', label: '시주' },
  { key: 'day', label: '일주' },
  { key: 'month', label: '월주' },
  { key: 'year', label: '년주' },
];

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

const elementColors: Record<string, { bg: string; hex: string; hanja: string }> = {
  목: { bg: 'bg-[#417e50]', hex: '#417e50', hanja: '木' },
  화: { bg: 'bg-[#db3c39]', hex: '#db3c39', hanja: '火' },
  토: { bg: 'bg-[#c58e49]', hex: '#c58e49', hanja: '土' },
  금: { bg: 'bg-[#8f9190]', hex: '#8f9190', hanja: '金' },
  수: { bg: 'bg-[#5f9ec1]', hex: '#5f9ec1', hanja: '水' },
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

type Preview = {
  personId?: string;
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
  editPerson: SavedPerson | null;
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
  baziResult?: BaziResult;
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

function getBirthHourOption(value: string) {
  return String(parseBirthHour(value));
}

function formatBirthTime(value: string) {
  if (!value) return '시간 모름';
  const hour = parseBirthHour(value);
  const minute = parseBirthMinute(value);
  return `${hour}시 ${minute}분`;
}

function buildBirthTime(hourOption: string, minuteOption: string) {
  const hour = Number(hourOption);
  const minute = Number(minuteOption);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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

function formatCalendarDate(date?: { year?: number; month?: string | number; day?: string | number }) {
  if (!date?.year || !date.month || !date.day) return '-';
  return `${date.year}.${String(date.month).padStart(2, '0')}.${String(date.day).padStart(2, '0')}`;
}

function getPillarDetail(result: BaziResult, key: PillarKey) {
  return result.analysis?.details?.[detailKeyByPillar[key]];
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
      const pillar = key === 'time' ? (pillars.time || pillars.hour) : pillars[key];
      const ganElement = elementByChar[pillar?.gan?.ch || pillar?.gan?.kr || ''];
      if (ganElement) counts[ganElement] += 1;

      const branchChar = pillar?.ji?.ch || pillar?.ji?.kr || '';
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

function hasBirthParams(value: BaziResult['birth_params']): value is NonNullable<BaziResult['birth_params']> {
  return Boolean(value?.year && value.month && value.day && value.hour && value.min && value.sl && value.gen);
}

function getSavedPersonPreview(person: SavedPerson, form: FormState) {
  const birthParams = hasBirthParams(person.birthParams)
    ? person.birthParams
    : hasBirthParams(person.baziResult?.birth_params)
      ? person.baziResult.birth_params
      : null;

  if (!person.baziResult?.four_pillars || !birthParams) return null;

  return { ...buildPreview(form, { ...person.baziResult, birth_params: birthParams }, birthParams), personId: person.id };
}

export default function PeopleClient({ isAuthenticated, initialPeople, editPerson }: Props) {
  const router = useRouter();
  const editForm = editPerson ? getSavedPersonForm(editPerson) : null;
  const [people, setPeople] = useState(initialPeople);
  const [editingPersonId, setEditingPersonId] = useState(editPerson?.id || '');
  const [form, setForm] = useState<FormState>(editForm || initialForm);
  const [preview, setPreview] = useState<Preview | null>(editPerson && editForm ? getSavedPersonPreview(editPerson, editForm) : null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [lastSaveMode, setLastSaveMode] = useState<'create' | 'update' | null>(null);

  const isValidBirthDate = useMemo(() => parseBirthDate(form.birthDate) !== null, [form.birthDate]);
  const canPreview = useMemo(() => form.name.trim().length > 0 && isValidBirthDate, [form.name, isValidBirthDate]);

  const updateField = (key: keyof FormState, value: string) => {
    window.sessionStorage.removeItem('bazi-consultation-draft');
    setForm((prev) => ({ ...prev, [key]: value }));
    setPreview(null);
    setSaveStatus('idle');
    setSaveMessage('');
    setLastSaveMode(null);
  };

  const updateBirthDate = (value: string) => {
    updateField('birthDate', value.replace(/\D/g, '').slice(0, 8));
  };

  const updateBirthHour = (hour: string) => {
    updateField('birthTime', buildBirthTime(hour, String(parseBirthMinute(form.birthTime))));
  };

  const updateBirthMinute = (minute: string) => {
    updateField('birthTime', buildBirthTime(getBirthHourOption(form.birthTime), minute));
  };

  const cancelPreview = () => {
    setForm(initialForm);
    setEditingPersonId('');
    setPreview(null);
    setSaveStatus('idle');
    setSaveMessage('');
    setLastSaveMode(null);
    setErrorMessage('');
    if (editPerson) {
      router.replace('/people');
    }
  };

  const startAnotherRegistration = () => {
    setForm(initialForm);
    setEditingPersonId('');
    setPreview(null);
    setSaveStatus('idle');
    setSaveMessage('');
    setLastSaveMode(null);
    setErrorMessage('');
    router.replace('/people');
    window.requestAnimationFrame(() => {
      document.getElementById('person-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPreview) return;

    window.sessionStorage.removeItem('bazi-consultation-draft');

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
      const isEditing = Boolean(editingPersonId);
      const response = await fetch('/api/people', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPersonId,
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
      setLastSaveMode(isEditing ? 'update' : 'create');
      setSaveMessage(data.message || (isEditing ? '인물 정보를 수정했습니다.' : '인물 정보를 저장했습니다.'));
      if (isSavedPerson(data.person)) {
        setPeople((current) => [data.person, ...current.filter((person) => person.id !== data.person.id)]);
        setPreview((current) => current ? { ...current, personId: data.person.id } : current);
        setEditingPersonId(data.person.id);
        if (isEditing) {
          router.replace('/people');
        }
      }
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : '인물 정보 저장에 실패했습니다.');
    }
  };

  return (
    <>
          <header className="flex h-12 items-center justify-between">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full text-[#171553]">
              <ChevronLeft className="h-7 w-7" strokeWidth={2.2} />
            </Link>
            <h1 className="text-[18px] font-semibold text-[#111111]">{editingPersonId ? '인물 수정' : '인물 등록'}</h1>
            <span className="h-10 w-10" />
          </header>

          <section className="mt-5 rounded-[12px] border border-[#ead8c6] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(92,61,25,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-semibold text-[#111111]">
                  저장된 인물 {isAuthenticated ? `${people.length}명` : ''}
                </h2>
                <p className="mt-0.5 truncate text-[12px] text-[#777777]">
                  {isAuthenticated ? '저장한 인물 정보를 확인하고 관리할 수 있어요' : '로그인 후 저장 목록을 볼 수 있어요'}
                </p>
              </div>
              {isAuthenticated ? (
                <Link
                  href="/people/manage"
                  className="font-display flex h-10 shrink-0 items-center justify-center rounded-[9px] border border-[#191450] bg-white px-4 text-[13px] font-medium text-[#191450] transition hover:bg-[#FEFAF5] disabled:cursor-not-allowed disabled:border-[#d8cec4] disabled:text-[#9a9088]"
                >
                  관리하기
                </Link>
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
              <div className="grid grid-cols-2 gap-3">
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
            <section
              className="mt-6 scroll-mt-4 overflow-hidden rounded-[12px] border border-[#ead8c6] bg-white shadow-[0_16px_38px_rgba(58,42,29,0.08)]"
            >
              <header className="border-b border-[#eadfd4] bg-[#fffaf4] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[19px] font-semibold text-[#171553]">사주 정보 미리보기</h2>
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
                <BaziPillarsTable result={preview.baziResult} />

                {(() => {
                  const elements = getElementBalance(preview.baziResult);
                  const strongest = [...elements].sort((a, b) => b.value - a.value)[0];

                  return (
                    <section className="rounded-[10px] border border-[#eee2d6] bg-[#fffdf9] px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Compass className="h-4 w-4 text-[#b06b16]" strokeWidth={2} />
                        <h3 className="text-[15px] font-semibold text-[#2a2018]">오행 분포도</h3>
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

                    </section>
                  );
                })()}

                <section className="rounded-[10px] border border-[#eadfd4] bg-[#FEFAF5] px-4 py-4">
                  {saveStatus === 'saved' ? (
                    <div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#357247]" strokeWidth={2} />
                        <div>
                          <h3 className="text-[16px] font-semibold text-[#214e2c]">
                            {lastSaveMode === 'update' ? '수정이 완료되었어요' : '저장이 완료되었어요'}
                          </h3>
                          <p className="mt-1 break-keep text-[12px] leading-5 text-[#5f6f62]">
                            저장한 인물로 상담을 시작하거나 다른 인물을 추가할 수 있어요.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={startAnotherRegistration}
                          className="font-display flex h-11 items-center justify-center gap-1.5 rounded-[9px] border border-[#191450] bg-white px-3 text-[13px] font-medium text-[#191450] transition-colors hover:bg-[#fffaf4]"
                        >
                          <UserPlus className="h-4 w-4" /> 다른 인물 등록
                        </button>
                        <Link
                          href="/consultations"
                          className="font-display flex h-11 items-center justify-center gap-1.5 rounded-[9px] bg-[#191450] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#24206a]"
                        >
                          <MessagesSquare className="h-4 w-4" /> 상담 선택하기
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={cancelPreview}
                        className="font-display flex h-11 items-center justify-center rounded-[9px] border border-[#191450] bg-white px-4 text-[14px] font-medium text-[#191450] transition-colors hover:bg-[#fffaf4]"
                      >
                        취소하기
                      </button>
                      {isAuthenticated ? (
                        <button
                          type="button"
                          onClick={handleSavePerson}
                          disabled={saveStatus === 'saving'}
                          className="font-display flex h-11 cursor-pointer items-center justify-center rounded-[9px] bg-[#191450] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#24206a] disabled:cursor-not-allowed disabled:bg-[#cfc8bd]"
                        >
                          {saveStatus === 'saving' ? '저장 중' : editingPersonId ? '수정 저장하기' : '저장하기'}
                        </button>
                      ) : (
                        <Link href="/auth/signin" className="font-display flex h-11 items-center justify-center rounded-[9px] bg-[#191450] px-4 text-[14px] font-medium text-white">
                          저장하기
                        </Link>
                      )}
                    </div>
                  )}
                  {saveMessage && saveStatus !== 'saved' && (
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
    </>
  );
}
