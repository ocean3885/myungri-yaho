'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type SessionResponse = {
  user?: unknown;
};

export default function HomeHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth/session')
      .then((response) => response.json())
      .then((session: SessionResponse) => {
        if (isMounted) {
          const authenticated = Boolean(session?.user);
          setIsAuthenticated(authenticated);

        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="relative flex h-16 shrink-0 items-center justify-center bg-[#FEFAF5]/95 px-5 pt-1 backdrop-blur max-[480px]:h-14 max-[480px]:px-4 max-[480px]:pt-0">
      <Link href="/" className="min-w-0" aria-label="홈으로 이동">
        <Image
          src="/images/yahologo3.png"
          alt="명리야호"
          width={180}
          height={48}
          priority
          className="h-auto w-[166px] object-contain max-[480px]:w-[146px]"
        />
      </Link>
      {isAuthenticated === false && (
        <Link
          href="/auth/signin"
          className="absolute right-5 top-1/2 flex h-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#ead8c6] bg-white px-3 text-[13px] font-semibold text-[#171553] transition hover:bg-[#fff8f0] max-[480px]:right-4"
          aria-label="로그인"
          title="로그인"
        >
          로그인
        </Link>
      )}
    </header>
  );
}
