'use client';

import { ChevronLeft, Coins, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { BaziResult } from '@/components/bazi/types';

type ConsultationDraft = {
  result: BaziResult;
  birthParams: BaziResult['birth_params'];
  subjectName: string;
};

type Props = {
  consultationType: {
    key: string;
    name: string;
    description: string | null;
    coinPrice: number;
  };
  balance: number;
  isAdmin: boolean;
};

export default function ConsultationConfirmationClient({ consultationType, balance, isAdmin }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<ConsultationDraft | null>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const hasEnoughCoins = isAdmin || balance >= consultationType.coinPrice;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const storedDraft = window.sessionStorage.getItem('bazi-consultation-draft');
        if (storedDraft) {
          const parsed = JSON.parse(storedDraft) as ConsultationDraft;
          if (parsed.result?.four_pillars && parsed.subjectName) {
            setDraft(parsed);
            return;
          }
        }
      } catch {
        window.sessionStorage.removeItem('bazi-consultation-draft');
      }
      setDraft(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function confirmConsultation() {
    if (!draft || isSubmitting || !hasEnoughCoins) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/bazi/user-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: draft.result,
          birthParams: draft.birthParams,
          subjectName: draft.subjectName,
          consultationType: consultationType.key,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || '상담 신청에 실패했습니다.');

      window.sessionStorage.removeItem('bazi-consultation-draft');
      router.replace(`/archive/${data.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상담 신청에 실패했습니다.');
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <header className="flex h-12 items-center justify-between">
        <Link href="/people" className="flex h-10 w-10 items-center justify-center rounded-full text-[#171553]" aria-label="인물 페이지로 돌아가기">
          <ChevronLeft className="h-7 w-7" strokeWidth={2.2} />
        </Link>
        <h1 className="text-[18px] font-semibold text-[#111111]">상담 신청 확인</h1>
        <span className="h-10 w-10" />
      </header>

      <main className="mt-5 space-y-4">
        <section className="rounded-[12px] border border-[#ead8c6] bg-white px-5 py-5 shadow-[0_10px_28px_rgba(58,42,29,0.07)]">
          <p className="text-[12px] font-semibold text-[#b06b16]">선택한 상담</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[#171553]">{consultationType.name}</h2>
          {consultationType.description && <p className="mt-2 break-keep text-[13px] leading-[1.65] text-[#66594d]">{consultationType.description}</p>}
          {draft && <p className="mt-4 rounded-[8px] bg-[#FEFAF5] px-3 py-2 text-[13px] text-[#493c31]">상담 대상: <strong>{draft.subjectName}</strong></p>}
        </section>

        <section className="rounded-[12px] border border-[#ead8c6] bg-[#fffaf4] px-5 py-5">
          <div className="flex items-start gap-3">
            {isAdmin ? <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#357247]" /> : <Coins className="mt-0.5 h-6 w-6 shrink-0 text-[#b06b16]" />}
            <div>
              <h2 className="text-[16px] font-semibold text-[#2a2018]">
                {isAdmin ? '운영자 상담' : `${consultationType.coinPrice}코인을 사용해 상담을 진행할까요?`}
              </h2>
              <p className="mt-2 text-[13px] leading-[1.65] text-[#66594d]">
                {isAdmin
                  ? '운영자는 코인 차감 없이 상담을 계속할 수 있습니다.'
                  : `현재 ${balance}코인 · 상담 후 ${Math.max(0, balance - consultationType.coinPrice)}코인`}
              </p>
            </div>
          </div>
        </section>

        {draft === null && (
          <p className="rounded-[10px] border border-[#f0d2c5] bg-[#fff2ec] px-4 py-3 text-[13px] leading-[1.6] text-[#a05738]">
            상담할 사주 정보를 찾을 수 없습니다. 인물 페이지에서 사주 정보를 다시 확인해주세요.
          </p>
        )}
        {!hasEnoughCoins && (
          <p className="rounded-[10px] border border-[#f0d2c5] bg-[#fff2ec] px-4 py-3 text-[13px] leading-[1.6] text-[#a05738]">
            코인이 부족합니다. {consultationType.coinPrice - balance}코인을 더 충전해주세요.
          </p>
        )}
        {message && <p className="rounded-[10px] bg-[#fff2ec] px-4 py-3 text-[13px] text-[#a05738]" role="alert">{message}</p>}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="font-display flex h-12 items-center justify-center rounded-[10px] border border-[#191450] bg-white text-[14px] font-medium text-[#191450]"
          >
            취소
          </button>
          {hasEnoughCoins ? (
            <button
              type="button"
              onClick={confirmConsultation}
              disabled={!draft || isSubmitting}
              className="font-display flex h-12 items-center justify-center rounded-[10px] bg-[#191450] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#cfc8bd]"
            >
              {isSubmitting ? '상담 시작 중...' : '확인 및 상담 시작'}
            </button>
          ) : (
            <Link href="/coins" className="font-display flex h-12 items-center justify-center rounded-[10px] bg-[#191450] text-[14px] font-medium text-white">코인 충전하기</Link>
          )}
        </div>
      </main>
    </>
  );
}
