'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Coins, LogIn, LogOut, Settings, UserRound } from 'lucide-react';

type Props = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userName: string | null;
  userEmail: string | null;
  coinBalance: number;
};

export default function MyClient({ isAuthenticated, isAdmin, userName, userEmail, coinBalance }: Props) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (!isAuthenticated) {
    return (
      <section className="pt-6">
        <div className="rounded-[12px] border border-[#ead8c6] bg-white px-5 py-6 shadow-[0_12px_32px_rgba(92,61,25,0.06)]">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f1e6db] text-[#7d5a36]">
              <UserRound className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold text-[#171553]">MY</h1>
              <p className="mt-1 break-keep text-[13px] leading-[1.55] text-[#66594d]">
                로그인 후 내 정보와 저장된 상담 기능을 이용할 수 있어요.
              </p>
            </div>
          </div>

          <Link
            href="/auth/signin"
            className="font-display mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#191450] text-[15px] font-medium text-white transition hover:bg-[#24206a]"
          >
            <LogIn className="h-4 w-4" strokeWidth={2} />
            로그인
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-6">
      <div className="rounded-[12px] border border-[#ead8c6] bg-white px-5 py-6 shadow-[0_12px_32px_rgba(92,61,25,0.06)]">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#191450] text-white">
            <UserRound className="h-6 w-6" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-semibold text-[#171553]">
              {userName || '명리야호 회원'}
            </h1>
            {userEmail && <p className="mt-1 truncate text-[13px] text-[#66594d]">{userEmail}</p>}
          </div>
        </div>

        <Link href="/coins" className="mt-6 flex items-center justify-between rounded-[8px] border border-[#ead8c6] bg-white px-4 py-3 text-[#171553]">
          <span className="flex items-center gap-2 text-[14px] font-medium"><Coins className="h-4 w-4 text-[#b06b16]" />보유 코인</span>
          <span className="font-semibold">{coinBalance} 코인</span>
        </Link>

        {isAdmin && (
          <Link
            href="/admin/bazi-prompts"
            className="font-display mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#191450] text-[15px] font-medium text-white transition hover:bg-[#24206a]"
          >
            <Settings className="h-4 w-4" strokeWidth={2} />
            프롬프트 관리
          </Link>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="font-display mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#ead8c6] bg-[#fffaf4] text-[15px] font-medium text-[#8a4d22] transition hover:bg-[#fff2e6]"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          로그아웃
        </button>
      </div>
    </section>
  );
}
