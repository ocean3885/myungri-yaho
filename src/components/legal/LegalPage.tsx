import Link from 'next/link';
import type { ReactNode } from 'react';

type Section = {
  title: string;
  content: ReactNode;
};

export default function LegalPage({ title, description, effectiveDate, sections }: {
  title: string;
  description: string;
  effectiveDate: string;
  sections: Section[];
}) {
  return (
    <article className="pb-8 text-[#342c27]">
      <div className="rounded-[16px] border border-[#eadfd4] bg-white px-5 py-6 shadow-[0_8px_30px_rgba(73,52,34,0.05)]">
        <p className="text-[12px] font-semibold tracking-[0.12em] text-[#8467c8]">LEGAL</p>
        <h1 className="mt-2 text-[25px] font-bold tracking-[-0.03em] text-[#171553]">{title}</h1>
        <p className="mt-3 text-[13px] leading-6 text-[#71655b]">{description}</p>
        <p className="mt-4 text-[12px] text-[#998b7e]">시행일: {effectiveDate}</p>
      </div>

      <div className="mt-5 space-y-3">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[14px] border border-[#eadfd4] bg-white px-5 py-5">
            <h2 className="text-[16px] font-bold text-[#29204f]">{section.title}</h2>
            <div className="mt-3 space-y-2 whitespace-pre-line text-[13px] leading-6 text-[#61564d]">{section.content}</div>
          </section>
        ))}
      </div>

      <Link href="/" className="mt-6 inline-flex text-[13px] font-semibold text-[#6d4bc3]">홈으로 돌아가기</Link>
    </article>
  );
}
