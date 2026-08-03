'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, LockKeyhole, UserRound } from 'lucide-react';

import HomeBottomNav from '@/components/home/HomeBottomNav';
import type { BaziResult, PillarKey } from '@/components/bazi/types';

const birthHourOptions = Array.from({ length: 12 }, (_, index) => index);
const birthMinuteOptions = Array.from({ length: 12 }, (_, index) => index * 5);
const pillarOrder: Array<{ key: PillarKey; label: string }> = [
  { key: 'year', label: '년주' },
  { key: 'month', label: '월주' },
  { key: 'day', label: '일주' },
  { key: 'time', label: '시주' },
];

type Preview = {
  name: string;
  relation: string;
  gender: string;
  calendar: string;
  birthDate: string;
  birthTime: string;
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

function buildPreview(form: FormState, baziResult: BaziResult): Preview {
  const parsedDate = parseBirthDate(form.birthDate);

  return {
    ...form,
    name: form.name || '이름 미입력',
    birthDate: parsedDate?.formatted || form.birthDate,
    birthTime: formatBirthTime(form.birthTime),
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

export default function PeopleClient({ isAuthenticated }: Props) {
  const [activeTab, setActiveTab] = useState('people');
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPreview) return;

    const baziParams = getBaziParams(form);
    if (!baziParams) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const searchParams = new URLSearchParams(baziParams);
      const response = await fetch(`/api/bazi/preview?${searchParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '사주 정보를 불러오지 못했습니다.');
      }

      setPreview(buildPreview(form, data as BaziResult));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '사주 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
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

          <section className="mt-5 rounded-[12px] border border-[#ead8c6] bg-white px-5 py-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#191450] text-white">
                <UserRound className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-[19px] font-semibold text-[#171553]">사주 정보를 입력해보세요</h2>
                <p className="mt-1 text-[13px] leading-[1.65] text-[#555555]">
                  비로그인 상태에서도 만세력 확인까지 체험할 수 있어요. 상담 결과 저장과 AI 해석은 가입 후 이용할 수 있습니다.
                </p>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
            <section className="mt-6 rounded-[12px] border border-[#ead8c6] bg-white px-5 py-5">
              <div className="flex items-center gap-2 text-[#171553]">
                <CalendarDays className="h-5 w-5" strokeWidth={2} />
                <h2 className="text-[17px] font-semibold">사주 정보 미리보기</h2>
              </div>

              <div className="mt-4 text-[13px] leading-[1.7] text-[#555555]">
                <p>
                  {preview.name} · {preview.relation} · {preview.gender}
                </p>
                <p>
                  {preview.calendar} {preview.birthDate} {preview.birthTime}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {pillarOrder.map((pillar) => {
                  const pillarText = getPillarText(preview.baziResult, pillar.key);

                  return (
                    <div key={pillar.key} className="rounded-[10px] border border-[#efe2d4] bg-[#FFF8F0] px-2 py-3 text-center">
                      <p className="text-[12px] text-[#777777]">{pillar.label}</p>
                      <p className="mt-1 text-[20px] font-semibold text-[#171553]">{pillarText.stem}</p>
                      <p className="text-[20px] font-semibold text-[#171553]">{pillarText.branch}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[10px] bg-[#FEFAF5] px-4 py-4">
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
                        onClick={() => alert('인물 저장 기능을 준비 중입니다.')}
                        className="font-display flex h-11 cursor-pointer items-center justify-center rounded-[9px] border border-[#191450] bg-white text-[14px] font-medium tracking-[0.01em] text-[#191450] transition-colors hover:bg-[#FEFAF5]"
                      >
                        저장하기
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
              </div>
            </section>
          )}
        </main>

        <HomeBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
