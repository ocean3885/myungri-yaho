'use client';

import { Suspense, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import HomeBottomNav from './HomeBottomNav';
import HomeHeader from './HomeHeader';
import SiteFooter from '../SiteFooter';

type Props = {
  children: ReactNode;
};

const shellRoutes = new Set(['/', '/consultations', '/people', '/archive', '/my', '/terms', '/privacy', '/refund-policy']);

export default function HomeAppShell({ children }: Props) {
  const pathname = usePathname();
  const shouldUseShell = shellRoutes.has(pathname) || pathname.startsWith('/archive/') || pathname.startsWith('/people/');

  if (!shouldUseShell) {
    return children;
  }

  return (
    <div className="flex min-h-screen w-full justify-center bg-[#FEFAF5] text-[#121225]">
      <div className="relative flex min-h-screen w-full max-w-[480px] flex-col bg-[#FEFAF5] shadow-[0_0_45px_rgba(47,34,17,0.12)]">
        <HomeHeader />
        <main className="relative z-10 flex-1 px-6 pb-28 pt-5 max-[480px]:px-5 max-[480px]:pb-[calc(4.5rem+env(safe-area-inset-bottom))] max-[480px]:pt-3">{children}</main>
        <SiteFooter />
        <Suspense fallback={null}>
          <HomeBottomNav />
        </Suspense>
      </div>
    </div>
  );
}
