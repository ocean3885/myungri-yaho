'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type UserSession = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type Props = {
  user: UserSession | null;
};

export default function HomeHero({ user }: Props) {
  return (
    <div className="relative z-10 grid grid-cols-12 gap-2 items-center mb-8">
      <div className="col-span-7 pr-2">
        <h2 className="text-[25px] font-extrabold text-white leading-tight tracking-tight font-sans">
          내 사주가 들려주는<br />오늘의 이야기
        </h2>
        <p className="text-zinc-400 text-xs mt-3 leading-relaxed font-medium">
          생년월일과 태어난 시간을 바탕으로 나만의 명리 해석을 만나보세요.
        </p>
        
        {/* Main Action Button */}
        <div className="mt-6">
          {user ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-xs font-semibold backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{user.name}님 분석 진행 중</span>
            </div>
          ) : (
            <Link 
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-[#523be4] hover:bg-[#432fd0] text-white text-xs font-bold transition duration-300 shadow-lg shadow-[#523be4]/30"
            >
              <span>무료로 오늘의 운세 보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {!user && (
          <span className="text-[10px] text-zinc-500 mt-3 block font-medium">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/signin" className="text-purple-400 hover:underline">
              로그인
            </Link>
          </span>
        )}
      </div>

      {/* Female Counselor Asset */}
      <div className="col-span-5 relative flex justify-end">
        <div className="w-32 h-32 relative flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-b from-[#2b2554]/30 to-transparent">
          <Image 
            src="/images/yaho_female_helper.png"
            alt="Helper Avatar"
            fill
            priority
            className="object-cover scale-110 translate-y-1.5"
          />
        </div>
      </div>
    </div>
  );
}
