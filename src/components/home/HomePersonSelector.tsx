'use client';

import React from 'react';
import { ChevronDown, UserRound } from 'lucide-react';

type UserSession = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type ConsultationItem = {
  id: string;
  subject_name: string;
  status: string;
  request_date_kst: string;
  result_text?: string;
};

type Props = {
  user: UserSession | null;
  consultations: ConsultationItem[];
};

export default function HomePersonSelector({ user, consultations }: Props) {
  const currentName = consultations[0]?.subject_name || user?.name || '김명리';

  return (
    <section className="mt-8">
      <h2 className="text-[17px] font-semibold text-[#111111]">현재 보고 있는 인물</h2>

      <button
        type="button"
        onClick={() => alert('인물 선택 기능을 준비 중입니다.')}
        className="mt-3 flex h-[56px] w-full items-center justify-between rounded-[12px] border border-[#ead8c6] bg-white px-4 transition hover:border-[#dfc5aa]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#191450] text-white">
            <UserRound className="h-6 w-6 fill-white/80 stroke-[1.6]" />
          </span>
          <span className="truncate text-[18px] font-medium tracking-normal text-[#16144d] max-[360px]:text-[17px]">
            {currentName} · 나
          </span>
        </span>
        <ChevronDown className="h-6 w-6 shrink-0 text-[#151348] stroke-[2.4]" />
      </button>
    </section>
  );
}
