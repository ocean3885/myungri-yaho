'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Archive, Home as HomeIcon, Sparkles, User, UserRound } from 'lucide-react';

export default function HomeBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isConsultationFlow = pathname === '/consultations'
    || pathname.startsWith('/people/consultation')
    || (pathname === '/people' && searchParams.has('consultation'));
  const activeTab = isConsultationFlow
    ? 'consultations'
    : pathname.startsWith('/people')
      ? 'people'
      : pathname.startsWith('/archive')
        ? 'archive'
        : pathname === '/my'
          ? 'my'
          : 'home';

  const itemClass = (tab: string) =>
    `relative flex min-h-12 cursor-pointer flex-col items-center justify-center transition ${
      activeTab === tab ? 'text-[#171553]' : 'text-[#3e3e3e]'
    }`;
  const labelClass = (tab: string) =>
    `mt-1 text-[12px] max-[480px]:mt-0.5 max-[480px]:text-[11px] ${activeTab === tab ? 'font-semibold' : 'font-normal'}`;
  const activeMarker = (tab: string) =>
    activeTab === tab ? <span className="absolute -top-3 h-1.5 w-8 rounded-full bg-[#dda445] max-[480px]:-top-2" /> : null;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-5 rounded-t-[22px] border border-[#e9e4dd] bg-white px-3 pb-5 pt-3 shadow-[0_-10px_24px_rgba(76,55,30,0.1)] max-[480px]:rounded-t-[18px] max-[480px]:px-1 max-[480px]:pb-[max(0.5rem,env(safe-area-inset-bottom))] max-[480px]:pt-2">
      <button
        onClick={() => {
          router.push('/');
        }}
        className={itemClass('home')}
      >
        {activeMarker('home')}
        <HomeIcon className="h-8 w-8 max-[480px]:h-6 max-[480px]:w-6" strokeWidth={1.9} />
        <span className={labelClass('home')}>홈</span>
      </button>

      <button
        onClick={() => {
          router.push('/people');
        }}
        className={itemClass('people')}
      >
        {activeMarker('people')}
        <UserRound className="h-8 w-8 max-[480px]:h-6 max-[480px]:w-6" strokeWidth={1.9} />
        <span className={labelClass('people')}>인물</span>
      </button>

      <button
        onClick={() => {
          router.push('/consultations');
        }}
        className="relative flex min-h-12 cursor-pointer flex-col items-center justify-end text-[#171553]"
        aria-label="상담 선택"
      >
        <span className={`absolute -top-7 flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-white shadow-[0_8px_20px_rgba(25,20,80,0.28)] transition-colors ${activeTab === 'consultations' ? 'bg-[#dda445] text-[#171553]' : 'bg-[#191450] text-white'}`}>
          <Sparkles className="h-6 w-6" strokeWidth={2} />
        </span>
        <span className={labelClass('consultations')}>상담</span>
      </button>

      <button
        onClick={() => {
          router.push('/archive');
        }}
        className={itemClass('archive')}
      >
        {activeMarker('archive')}
        <Archive className="h-8 w-8 max-[480px]:h-6 max-[480px]:w-6" strokeWidth={1.9} />
        <span className={labelClass('archive')}>보관함</span>
      </button>

      <button
        onClick={() => {
          router.push('/my');
        }}
        className={itemClass('my')}
      >
        {activeMarker('my')}
        <User className="h-8 w-8 max-[480px]:h-6 max-[480px]:w-6" strokeWidth={1.9} />
        <span className={labelClass('my')}>MY</span>
      </button>
    </nav>
  );
}
