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
          setIsAuthenticated(Boolean(session?.user));
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
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-center bg-[#FEFAF5]/95 px-6 pt-4 backdrop-blur">
      <Link href="/" className="absolute left-1/2 -translate-x-1/2" aria-label="홈으로 이동">
        <Image
          src="/images/my-logo.png"
          alt="명리야호"
          width={180}
          height={48}
          priority
          className="object-contain"
        />
      </Link>
      {isAuthenticated === false && (
        <Link
          href="/auth/signin"
          className="absolute right-6 flex h-9 w-9 items-center justify-center rounded-full border border-[#ead8c6] bg-white text-[#171553] transition hover:bg-[#fff8f0]"
          aria-label="로그인"
          title="로그인"
        >
          <LogIn className="h-[18px] w-[18px]" strokeWidth={2} />
        </Link>
      )}
    </header>
  );
}
