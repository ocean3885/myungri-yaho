import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileCheck2, House, ScrollText } from 'lucide-react';

import { getAdminAccess } from '@/lib/admin-access';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getAdminAccess();

  if (!admin) {
    redirect('/auth/signin');
  }

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-5 py-8 text-[#1e1a16] lg:px-8">
      <div className="mx-auto w-full max-w-[1680px]">
        <header className="mb-6 flex flex-col gap-4 rounded-[12px] border border-[#ead8c6] bg-white px-5 py-5 shadow-[0_12px_32px_rgba(92,61,25,0.06)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#b06b16]">Admin</p>
            <h1 className="mt-1 text-[26px] font-semibold text-[#171553]">운영자 관리</h1>
            <p className="mt-1 text-[15px] text-[#66594d]">{admin.email}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="flex h-11 items-center gap-2 rounded-[9px] border border-[#ead8c6] bg-white px-4 text-[15px] font-semibold text-[#66594d] transition hover:bg-[#fff8f0]"
            >
              <House className="h-4 w-4" />
              홈
            </Link>
            <Link
              href="/admin/bazi-prompts"
              className="flex h-11 items-center gap-2 rounded-[9px] bg-[#191450] px-4 text-[15px] font-semibold text-white transition hover:bg-[#24206a]"
            >
              <ScrollText className="h-4 w-4" />
              프롬프트
            </Link>
            <Link
              href="/admin/final-drafts"
              className="flex h-11 items-center gap-2 rounded-[9px] border border-[#cfc9e7] bg-[#f5f3ff] px-4 text-[15px] font-semibold text-[#191450] transition hover:bg-[#ebe7ff]"
            >
              <FileCheck2 className="h-4 w-4" />
              최종본
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
