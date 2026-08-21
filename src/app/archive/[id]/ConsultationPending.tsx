'use client';

import { LoaderCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ConsultationPending() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <div
      className="mt-3 flex items-center gap-3 rounded-[9px] border border-[#ead8c6] bg-[#fff8ec] px-3 py-3 text-[#9a6616]"
      role="status"
      aria-live="polite"
    >
      <Image
        src="/images/myungho/myho-hello.webp"
        alt="인사하는 명호"
        width={600}
        height={600}
        className="h-20 w-20 shrink-0 object-contain"
      />
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[13px] font-semibold leading-[1.55]">
          <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" strokeWidth={2} aria-hidden="true" />
          상담을 생성하고 있어요
        </p>
        <p className="mt-0.5 text-[12px] leading-[1.55] text-[#866b44]">완료되면 결과가 자동으로 표시됩니다.</p>
      </div>
    </div>
  );
}
