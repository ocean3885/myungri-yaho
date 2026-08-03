'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  href?: string;
  onClick?: () => void;
};

const buttonClass =
  'font-display mt-6 flex h-[48px] w-[168px] max-w-full cursor-pointer items-center justify-center rounded-[9px] bg-[#191450] px-3 text-[15px] font-medium text-white shadow-[0_12px_24px_rgba(25,20,80,0.24)] transition-colors duration-200 ease-out hover:bg-[#24206a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191450]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF8F0] active:bg-[#120f3d] max-[360px]:w-[158px] max-[360px]:text-[14px]';

export default function HomeHeroActionButton({ href, onClick }: Props) {
  const label = '사주 분석하기';

  if (href) {
    return (
      <Link href={href} className={buttonClass}>
        <span className="truncate tracking-[0.01em]">{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={buttonClass}>
      <span className="truncate tracking-[0.01em]">{label}</span>
    </button>
  );
}
