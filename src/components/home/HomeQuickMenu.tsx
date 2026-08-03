'use client';

import React from 'react';
import { CalendarDays, Compass, MessageCircle, TrendingUp } from 'lucide-react';

const quickMenus = [
  { label: '오늘의 운세', icon: Compass, color: '#171553' },
  { label: '좋은 날 보기', icon: CalendarDays, color: '#dea128' },
  { label: '나의 흐름', icon: TrendingUp, color: '#171553' },
  { label: '고민 상담', icon: MessageCircle, color: '#ed4260' },
];

export default function HomeQuickMenu() {
  return (
    <section className="mt-5 rounded-[12px] border border-[#efddca] bg-white px-2 py-4 shadow-[0_8px_24px_rgba(92,61,25,0.05)]">
      <div className="grid grid-cols-4 divide-x divide-[#eadfd1]">
        {quickMenus.map(({ label, icon: Icon, color }) => (
          <button
            key={label}
            type="button"
            onClick={() => alert(`${label} 기능을 준비 중입니다.`)}
            className="flex min-w-0 flex-col items-center gap-2 px-1 text-center"
          >
            <Icon
              className="h-8 w-8 max-[360px]:h-7 max-[360px]:w-7"
              style={{ color }}
              strokeWidth={1.9}
            />
            <span className="text-[14px] font-medium leading-tight text-[#141414] max-[360px]:text-[12px]">
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
