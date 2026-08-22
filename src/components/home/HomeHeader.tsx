'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

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
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 bg-[#FEFAF5]/95 px-5 pt-1 backdrop-blur max-[480px]:h-14 max-[480px]:px-4 max-[480px]:pt-0">
      <Link href="/" className="min-w-0" aria-label="홈으로 이동">
        <Image
          src="/images/yahologo3.png"
          alt="명리야호"
          width={180}
          height={48}
          priority
          className="h-auto w-[150px] object-contain max-[480px]:w-[132px]"
        />
      </Link>
      {isAuthenticated === false && (
        <Link
          href="/auth/signin"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ead8c6] bg-white text-[#171553] transition hover:bg-[#fff8f0]"
          aria-label="로그인"
          title="로그인"
        >
          <LogIn className="h-[18px] w-[18px]" strokeWidth={2} />
        </Link>
      )}
    </header>
  );
}
