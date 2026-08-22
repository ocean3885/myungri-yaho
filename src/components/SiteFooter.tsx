import Link from 'next/link';
import { siteInfo } from '@/lib/site-info';

const policyLinks = [
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
  { href: '/refund-policy', label: '환불정책' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#e8ddd2] bg-[#f8f1e9] px-6 pb-28 pt-7 text-[#76695d] max-[480px]:px-5 max-[480px]:pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <nav aria-label="정책 안내" className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold text-[#3d342d]">
        {policyLinks.map((link) => (
          <Link key={link.href} href={link.href} className="transition-colors hover:text-[#6d4bc3]">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5 space-y-1 text-[11px] leading-[1.75]">
        <p><span className="font-semibold text-[#55493f]">{siteInfo.companyName}</span> · 대표 {siteInfo.representative}</p>
        <p>사업자등록번호 {siteInfo.businessRegistrationNumber}</p>
        <p>
          통신판매업 신고 {siteInfo.mailOrderRegistrationNumber}
          {siteInfo.mailOrderRegistrationAuthority && ` · ${siteInfo.mailOrderRegistrationAuthority}`}
        </p>
        <p>주소 {siteInfo.address}</p>
        <p>
          고객센터 {siteInfo.customerServicePhone} ·{' '}
          <a className="underline underline-offset-2" href={`mailto:${siteInfo.customerServiceEmail}`}>{siteInfo.customerServiceEmail}</a>
        </p>
        <p>운영시간 {siteInfo.customerServiceHours}</p>
      </div>

      <p className="mt-4 text-[10px] leading-4 text-[#9a8c7e]">
        © {new Date().getFullYear()} {siteInfo.serviceName}. All rights reserved.
      </p>
    </footer>
  );
}
