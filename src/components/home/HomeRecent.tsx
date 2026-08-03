'use client';

import React from 'react';
import { ChevronRight, FileText, Heart } from 'lucide-react';

type ConsultationItem = {
  id: string;
  subject_name: string;
  status: string;
  request_date_kst: string;
  result_text?: string;
};

type Props = {
  consultations: ConsultationItem[];
};

export default function HomeRecent({ consultations }: Props) {
  const fallbackConsultations = [
    {
      id: 'sample-basic',
      subject_name: '김명리',
      title: '기본 사주 분석',
      tags: '신중함 · 책임감 · 독립성',
      date: '오늘',
      icon: FileText,
      tone: 'lavender',
    },
    {
      id: 'sample-love',
      subject_name: '박야호',
      title: '연애 성향 상담',
      tags: '배려심 · 현실감 · 따뜻함',
      date: '2일 전',
      icon: Heart,
      tone: 'coral',
    },
  ];

  const visibleConsultations = consultations.slice(0, 2).map((item, index) => ({
    id: item.id,
    subject_name: item.subject_name || (index === 0 ? '김명리' : '박야호'),
    title: index === 0 ? '기본 사주 분석' : '연애 성향 상담',
    tags: item.result_text || (index === 0 ? '신중함 · 책임감 · 독립성' : '배려심 · 현실감 · 따뜻함'),
    date: item.request_date_kst || (index === 0 ? '오늘' : '2일 전'),
    icon: index === 0 ? FileText : Heart,
    tone: index === 0 ? 'lavender' : 'coral',
  }));

  const recentItems = visibleConsultations.length > 0 ? visibleConsultations : fallbackConsultations;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-[#111111]">최근 상담 기록</h3>
        <button
          type="button"
          onClick={() => alert('전체 상담 목록 페이지를 준비 중입니다.')}
          className="flex items-center text-[14px] font-medium text-[#171553]"
        >
          <span>전체 보기</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#ead8c6] bg-white shadow-[0_8px_24px_rgba(92,61,25,0.05)]">
        {recentItems.map((item, index) => {
          const Icon = item.icon;
          const isCoral = item.tone === 'coral';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => alert(`${item.subject_name}님의 ${item.title}을 준비 중입니다.`)}
              className={`flex min-h-[78px] w-full items-center gap-4 px-4 py-3 text-left ${
                index > 0 ? 'border-t border-[#f0e4d8]' : ''
              }`}
            >
              <span
                className={`flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full ${
                  isCoral ? 'bg-[#ffe1d8] text-[#ed4260]' : 'bg-[#e8e1ef] text-[#171553]'
                }`}
              >
                <Icon className="h-7 w-7" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold text-[#171553]">
                  {item.subject_name} · {item.title}
                </span>
                <span className="mt-0.5 block truncate text-[13px] font-normal text-[#454545]">
                  {item.tags}
                </span>
                <span className="mt-0.5 block text-[13px] font-normal text-[#777777]">
                  {item.date}
                </span>
              </span>
              <ChevronRight className="h-7 w-7 shrink-0 text-[#171553] stroke-[2.4]" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
