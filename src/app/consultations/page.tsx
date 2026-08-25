import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Compass,
  HeartHandshake,
  Landmark,
  Leaf,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { auth } from '@/auth';
import HomeHero from '@/components/home/HomeHero';
import type { ConsultationIconKey } from '@/lib/consultation-icons';
import { listConsultationTypes } from '@/lib/consultation-types';
import { createAdminClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: '상담 | 명리야호',
  description: '궁금한 주제를 선택하고 명리 상담을 시작하세요.',
};

export default async function ConsultationsPage() {
  const db = await createAdminClient();
  const [consultationTypes, session] = await Promise.all([
    listConsultationTypes(db, true),
    auth(),
  ]);
  const [featured, ...others] = consultationTypes;
  const consultationHref = (key: string) => session?.user
    ? `/people/consultation?type=${encodeURIComponent(key)}`
    : `/auth/signin?callbackUrl=${encodeURIComponent(`/people/consultation?type=${key}`)}`;

  const iconComponents = {
    sparkles: Sparkles,
    users: Users,
    heart: HeartHandshake,
    landmark: Landmark,
    briefcase: BriefcaseBusiness,
    leaf: Leaf,
    compass: Compass,
    calendar: CalendarDays,
  } satisfies Record<ConsultationIconKey, typeof Sparkles>;
  const FeaturedIcon = featured ? iconComponents[featured.iconKey] : Sparkles;

  return (
    <section className="pb-1">
      <HomeHero />

      <div id="consultation-types" className="scroll-mt-20 px-1 pt-8">
        <h1 className="font-display text-[24px] font-medium leading-[1.4] text-[#201b2d]">
          어떤 상담이 궁금하세요?
        </h1>
        <p className="mt-1.5 text-[14px] text-[#766d68]">지금 가장 궁금한 주제를 골라보세요.</p>
      </div>

      {featured && (
        <article className="mt-6 overflow-hidden rounded-[16px] border border-[#e5d6c8] bg-white shadow-[0_12px_30px_rgba(76,55,30,0.08)]">
          <div className="relative h-[168px] w-full bg-[#f6efe8]">
            {featured.imageUrl ? (
              <Image
                src={featured.imageUrl}
                alt={`${featured.name} 이미지`}
                fill
                priority
                sizes="(min-width: 480px) 430px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#f4ecff] text-[#6d4bc3]">
                <FeaturedIcon className="h-12 w-12" strokeWidth={1.5} />
              </div>
            )}
            <span className="absolute left-4 top-4 rounded-[8px] border border-[#d7a85d] bg-white/90 px-3 py-2 text-[12px] font-semibold text-[#a66c1a] backdrop-blur">
              처음이라면 추천
            </span>
          </div>

          <div className="px-5 py-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0eaff] text-[#6d4bc3]">
                <FeaturedIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[19px] font-medium text-[#201b2d]">{featured.name}</h2>
                {featured.description && (
                  <p className="mt-1.5 line-clamp-2 break-keep text-[13px] leading-5 text-[#766d68]">
                    {featured.description}
                  </p>
                )}
                <p className="mt-3 text-[16px] font-semibold text-[#a66c1a]">
                  {featured.priceKrw === 0 ? '무료' : `${featured.priceKrw.toLocaleString('ko-KR')}원`}
                </p>
              </div>
            </div>
            <Link
              href={consultationHref(featured.key)}
              className="font-display mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[9px] bg-[#191450] text-[14px] font-medium text-white transition hover:bg-[#24206a]"
            >
              {featured.name} 시작하기 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      )}

      <div className="mt-4 space-y-3">
        {others.map((type) => {
          const Icon = iconComponents[type.iconKey];
          return (
            <Link
              key={type.key}
              href={consultationHref(type.key)}
              className="flex min-h-[104px] items-center gap-4 rounded-[13px] border border-[#e9ddd2] bg-white px-4 py-4 shadow-[0_5px_18px_rgba(76,55,30,0.035)] transition hover:border-[#d6bd9f] hover:bg-[#fffdf9]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f7eef1] text-[#b85c79]">
                <Icon className="h-6 w-6" strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-display block text-[16px] font-medium text-[#201b2d]">{type.name}</span>
                {type.description && (
                  <span className="mt-1 block truncate text-[13px] text-[#766d68]">{type.description}</span>
                )}
                <span className="mt-1.5 block text-[13px] font-semibold text-[#a66c1a]">
                  {type.priceKrw === 0 ? '무료' : `${type.priceKrw.toLocaleString('ko-KR')}원`}
                </span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e9ddd2] text-[#201b2d]">
                <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-7 flex items-center gap-3 rounded-[12px] border border-[#ead8c6] bg-[#fffaf4] px-4 py-4">
        <ShieldCheck className="h-7 w-7 shrink-0 text-[#a9782d]" strokeWidth={1.7} />
        <p className="break-keep text-[12px] leading-5 text-[#66594d]">
          입력한 정보는 상담 목적으로만 안전하게 사용돼요.
        </p>
      </div>
    </section>
  );
}
