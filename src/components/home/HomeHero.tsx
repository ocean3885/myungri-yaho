'use client';

import React from 'react';
import Image from 'next/image';

import HomeHeroActionButton from './HomeHeroActionButton';

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

export default function HomeHero({ user, consultations }: Props) {
  const currentSubject = consultations[0]?.subject_name || user?.name || '김명리';

  return (
    <section className="relative mt-5 min-h-[324px] overflow-hidden rounded-[12px] border border-[#f1dfcc] bg-[#FFF8F0] px-5 py-7 shadow-[0_10px_25px_rgba(92,61,25,0.07)]">
      <div className="pointer-events-none absolute right-0 top-14 h-12 w-24 rounded-l-full border-y border-l border-white/70" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-[158px] rounded-tl-full bg-[#f3e5d9]" />
      <div className="pointer-events-none absolute right-28 top-[108px] text-[32px] font-black leading-none text-[#e7ad2d]">
        *
      </div>

      <div className="relative z-10">
        <h2 className="font-display text-[25px] font-semibold leading-[1.42] tracking-normal text-[#171553] max-[360px]:text-[22px]">
          사주로 나와 소중한 사람을 더 깊이 이해해보세요
        </h2>
        <p className="mt-5 max-w-[58%] text-[14px] font-normal leading-[1.68] text-[#171717] max-[360px]:max-w-[60%] max-[360px]:text-[13px]">
          저장된 인물의 생년월일시를 바탕으로 성향, 흐름, 고민 상담을 확인할 수 있어요.
        </p>

        <HomeHeroActionButton
          href={user ? undefined : '/auth/signin'}
          onClick={user ? () => alert(`${currentSubject}님의 사주 분석 기능을 준비 중입니다.`) : undefined}
        />
      </div>

      <div className="absolute -right-4 bottom-0 h-[194px] w-[194px] max-[360px]:-right-8 max-[360px]:h-[168px] max-[360px]:w-[168px]">
        <Image
          src="/images/myungho/myho-hello.webp"
          alt="명리야호 캐릭터"
          fill
          priority
          sizes="220px"
          className="object-contain drop-shadow-[0_18px_20px_rgba(73,45,20,0.22)]"
        />
      </div>
    </section>
  );
}
