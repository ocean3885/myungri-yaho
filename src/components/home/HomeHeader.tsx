'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Coins, LogIn } from 'lucide-react';

type SessionResponse = {
  user?: unknown;
};

export default function HomeHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth/session')
      .then((response) => response.json())
      .then((session: SessionResponse) => {
        if (isMounted) {
          const authenticated = Boolean(session?.user);
          setIsAuthenticated(authenticated);

          if (authenticated) {
            fetch('/api/coins')
              .then((response) => {
                if (!response.ok) throw new Error('코인 잔액 조회 실패');
                return response.json();
              })
              .then((data: { balance?: number }) => {
                if (isMounted) setCoinBalance(data.balance ?? 0);
              })
              .catch(() => {
                if (isMounted) setCoinBalance(0);
              });
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      });

    const handleBalanceUpdate = (event: Event) => {
      const balance = (event as CustomEvent<{ balance: number }>).detail?.balance;
      if (typeof balance === 'number') setCoinBalance(balance);
    };

    window.addEventListener('coin-balance-updated', handleBalanceUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('coin-balance-updated', handleBalanceUpdate);
    };
  }, []);

  return (
    <header className="flex h-20 shrink-0 items-center justify-between gap-3 bg-[#FEFAF5]/95 px-6 pt-4 backdrop-blur max-[480px]:h-16 max-[480px]:px-4 max-[480px]:pt-2">
      <Link href="/" className="min-w-0" aria-label="홈으로 이동">
        <Image
          src="/images/my-logo.png"
          alt="명리야호"
          width={180}
          height={48}
          priority
          className="h-auto w-[180px] object-contain max-[480px]:w-[150px]"
        />
      </Link>
      {isAuthenticated === true && (
        <Link
          href="/coins"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] border border-[#ead8c6] bg-white px-3 text-[#171553] transition hover:bg-[#fff8f0]"
          aria-label={`보유 코인 ${coinBalance ?? 0}개, 충전 페이지로 이동`}
        >
          <Coins className="h-4 w-4 text-[#b06b16]" strokeWidth={2} />
          <span className="text-[13px] font-semibold tabular-nums">{coinBalance ?? 0}</span>
        </Link>
      )}
      {isAuthenticated === false && (
        <Link
          href="/auth/signin"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ead8c6] bg-white text-[#171553] transition hover:bg-[#fff8f0]"
          aria-label="로그인"
          title="로그인"
        >
          <LogIn className="h-[18px] w-[18px]" strokeWidth={2} />
        </Link>
      )}
    </header>
  );
}
