'use client';

import React from 'react';
import Image from 'next/image';

export default function HomeHero() {
  return (
    <section className="relative min-h-[244px] overflow-hidden rounded-[12px] border border-[#f1dfcc] bg-[#FFF8F0] px-5 py-6 shadow-[0_10px_25px_rgba(92,61,25,0.07)]">
      <div className="pointer-events-none absolute right-0 top-10 h-12 w-24 rounded-l-full border-y border-l border-white/70" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-14 w-[144px] rounded-tl-full bg-[#f3e5d9]" />
      <div className="pointer-events-none absolute right-24 top-[82px] text-[28px] font-black leading-none text-[#e7ad2d]">
        *
      </div>

      <div className="relative z-10 max-w-[68%]">
        <p className="text-[12px] font-semibold text-[#a66c1a]">답이 필요한 순간</p>
        <h2 className="font-display mt-2 text-[24px] font-medium leading-[1.42] tracking-normal text-[#171553] max-[360px]:text-[21px]">
          고민은 가볍게,<br />당신의 답은 선명하게
        </h2>
        <p className="mt-3 break-keep text-[13px] font-normal leading-[1.65] text-[#51483f] max-[360px]:text-[12px]">
          사주에 담긴 흐름을 읽고, 지금 필요한 상담을 시작해보세요.
        </p>
      </div>

      <div className="absolute -right-3 bottom-0 h-[172px] w-[172px] max-[360px]:-right-7 max-[360px]:h-[150px] max-[360px]:w-[150px]">
        <Image
          src="/images/myungho/myho-hello.webp"
          alt="명리야호 캐릭터"
          fill
          priority
          sizes="180px"
          className="object-contain drop-shadow-[0_18px_20px_rgba(73,45,20,0.22)]"
        />
      </div>
    </section>
  );
}
