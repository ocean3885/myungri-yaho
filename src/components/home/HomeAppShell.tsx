'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import HomeBottomNav from './HomeBottomNav';
import HomeHeader from './HomeHeader';

type Props = {
  children: ReactNode;
};

const shellRoutes = new Set(['/', '/people', '/my']);

export default function HomeAppShell({ children }: Props) {
  const pathname = usePathname();
  const shouldUseShell = shellRoutes.has(pathname);

  if (!shouldUseShell) {
    return children;
  }

  return (
    <div className="flex min-h-screen w-full justify-center bg-[#FEFAF5] text-[#121225]">
      <div className="relative flex min-h-screen w-full max-w-[480px] flex-col bg-[#FEFAF5] shadow-[0_0_45px_rgba(47,34,17,0.12)]">
        <HomeHeader />
        <main className="relative z-10 flex-1 px-6 pb-28 pt-5">{children}</main>
        <HomeBottomNav />
      </div>
    </div>
  );
}
