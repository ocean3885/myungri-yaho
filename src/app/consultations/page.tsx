import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import { listConsultationTypes } from '@/lib/consultation-types';
import { createAdminClient } from '@/utils/supabase/server';
import { auth } from '@/auth';

export const metadata: Metadata = { title: '상담 선택 | 명리야호', description: '원하는 명리 상담 종류와 가격을 확인하고 상담을 시작하세요.' };

export default async function ConsultationsPage() {
  const db = await createAdminClient();
  const [consultationTypes, session] = await Promise.all([listConsultationTypes(db, true), auth()]);

  return <section className="pb-8 pt-2">
    <div className="rounded-[16px] border border-[#ead8c6] bg-[#fff8f0] px-5 py-6">
      <p className="text-[12px] font-semibold tracking-[0.12em] text-[#b06b16]">CONSULTATION</p>
      <h1 className="mt-2 text-[25px] font-bold tracking-[-0.03em] text-[#171553]">어떤 상담이 궁금하세요?</h1>
      <p className="mt-3 break-keep text-[13px] leading-6 text-[#66594d]">상담 종류를 먼저 선택한 뒤 필요한 인물의 명식을 입력하거나 저장된 인물을 불러올 수 있어요.</p>
    </div>

    <div className="mt-5 space-y-3">
      {consultationTypes.map((type) => <article key={type.key} className="rounded-[14px] border border-[#ead8c6] bg-white px-5 py-5 shadow-[0_10px_28px_rgba(92,61,25,0.055)]">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4ecff] text-[#6d4bc3]">
            {type.subjectCount > 1 ? <Users className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-semibold text-[#171553]">{type.name}</h2>
              <span className="rounded-full bg-[#f6efe8] px-2 py-0.5 text-[11px] font-semibold text-[#7d5a36]">{type.subjectCount}명</span>
            </div>
            {type.description && <p className="mt-2 break-keep text-[13px] leading-6 text-[#66594d]">{type.description}</p>}
            <p className="mt-3 text-[17px] font-bold text-[#b06b16]">{type.priceKrw === 0 ? '무료' : `${type.priceKrw.toLocaleString('ko-KR')}원`}</p>
          </div>
        </div>
        <Link href={session?.user ? `/people?consultation=${encodeURIComponent(type.key)}` : `/auth/signin?callbackUrl=${encodeURIComponent(`/people?consultation=${type.key}`)}`} className="font-display mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-[#191450] text-[14px] font-medium text-white transition hover:bg-[#24206a]">
          이 상담 시작하기 <ArrowRight className="h-4 w-4" />
        </Link>
      </article>)}
    </div>

    <Link href="/people" className="mt-5 flex justify-center text-[13px] font-semibold text-[#6d4bc3]">인물부터 등록하거나 관리하기</Link>
  </section>;
}
