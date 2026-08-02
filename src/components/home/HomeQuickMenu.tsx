'use client';

import React from 'react';
import { Compass, Heart, Briefcase, MessageSquare, ChevronRight } from 'lucide-react';

export default function HomeQuickMenu() {
  const quickMenus = [
    { label: '사주 총평', icon: Compass },
    { label: '연애·궁합', icon: Heart },
    { label: '재물·직장', icon: Briefcase },
    { label: '고민 상담', icon: MessageSquare },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-xs mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-extrabold text-[15px] text-zinc-900 tracking-tight font-sans">빠른 메뉴</h3>
        <button 
          onClick={() => alert('전체 메뉴 리스트를 준비 중입니다.')}
          className="text-[11px] text-zinc-400 font-semibold hover:text-zinc-600 transition flex items-center cursor-pointer"
        >
          <span>전체 메뉴</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {quickMenus.map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => alert(`${item.label} 상담을 준비하고 있습니다.`)}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full border border-zinc-100 bg-zinc-50 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-50 group-hover:text-[#523be4] transition duration-200 text-zinc-600 shadow-2xs">
              <item.icon className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-bold mt-2 text-zinc-700 group-hover:text-zinc-950 transition">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
