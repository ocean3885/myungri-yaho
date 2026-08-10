'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Archive, Home as HomeIcon, User, UserRound } from 'lucide-react';

export default function HomeBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = pathname === '/people' ? 'people' : pathname === '/my' ? 'my' : 'home';

  const itemClass = (tab: string) =>
    `relative flex cursor-pointer flex-col items-center transition ${
      activeTab === tab ? 'text-[#171553]' : 'text-[#3e3e3e]'
    }`;
  const labelClass = (tab: string) =>
    `mt-1 text-[12px] ${activeTab === tab ? 'font-semibold' : 'font-normal'}`;
  const activeMarker = (tab: string) =>
    activeTab === tab ? <span className="absolute -top-3 h-1.5 w-8 rounded-full bg-[#dda445]" /> : null;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-4 rounded-t-[22px] border border-[#e9e4dd] bg-white px-4 pb-5 pt-3 shadow-[0_-10px_24px_rgba(76,55,30,0.1)]">
      <button
        onClick={() => {
          router.push('/');
        }}
        className={itemClass('home')}
      >
        {activeMarker('home')}
        <HomeIcon className="h-8 w-8" strokeWidth={1.9} />
        <span className={labelClass('home')}>홈</span>
      </button>

      <button
        onClick={() => {
          router.push('/people');
        }}
        className={itemClass('people')}
      >
        {activeMarker('people')}
        <UserRound className="h-8 w-8" strokeWidth={1.9} />
        <span className={labelClass('people')}>인물</span>
      </button>

      <button
        onClick={() => {
          alert('보관함 기능 페이지를 준비 중입니다.');
        }}
        className={itemClass('archive')}
      >
        {activeMarker('archive')}
        <Archive className="h-8 w-8" strokeWidth={1.9} />
        <span className={labelClass('archive')}>보관함</span>
      </button>

      <button
        onClick={() => {
          router.push('/my');
        }}
        className={itemClass('my')}
      >
        {activeMarker('my')}
        <User className="h-8 w-8" strokeWidth={1.9} />
        <span className={labelClass('my')}>MY</span>
      </button>
    </nav>
  );
}
