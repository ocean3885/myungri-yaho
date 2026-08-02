'use client';

import React from 'react';
import { Coins, Heart, Leaf, ChevronRight } from 'lucide-react';

type FortuneData = {
  score: number;
  wealth: number;
  relation: number;
  health: number;
  phrase: string;
};

type Props = {
  fortune: FortuneData;
};

export default function HomeFortuneCard({ fortune }: Props) {
  // SVG circular properties
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * fortune.score) / 100;

  return (
    <div className="relative z-10 bg-[#16122d]/80 border border-[#2b2554]/40 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-white font-bold text-[16px]">오늘의 흐름</h3>
          <span className="text-zinc-400 text-[10px] mt-1 block">8월 1일 (금)</span>
        </div>
      </div>

      {/* Grid Content: Text & Ring Chart */}
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-7 flex flex-col justify-center">
          <p className="text-zinc-200 font-semibold leading-relaxed text-xs">
            {fortune.phrase}
          </p>
        </div>

        {/* Ring Chart Container */}
        <div className="col-span-5 flex justify-end relative">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full progress-ring" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                stroke="rgba(255, 255, 255, 0.05)" 
                strokeWidth="7" 
                fill="transparent" 
              />
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                stroke="#523be4" 
                strokeWidth="7" 
                fill="transparent" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider block">종합운</span>
              <span className="text-white font-extrabold text-lg leading-none mt-0.5 block">{fortune.score}</span>
              <span className="text-[8px] text-zinc-500 mt-0.5 block">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Stat Lists */}
      <div className="grid grid-cols-3 gap-2 mt-6 py-3 px-3.5 rounded-2xl bg-white/5 border border-white/5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <div className="text-left">
            <span className="text-zinc-400 text-[10px] block leading-none">재물운</span>
            <span className="text-white font-bold text-xs mt-1 block leading-none">{fortune.wealth}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 border-x border-white/10">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
          <div className="text-left">
            <span className="text-zinc-400 text-[10px] block leading-none">관계운</span>
            <span className="text-white font-bold text-xs mt-1 block leading-none">{fortune.relation}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          <div className="text-left">
            <span className="text-zinc-400 text-[10px] block leading-none">건강운</span>
            <span className="text-white font-bold text-xs mt-1 block leading-none">{fortune.health}</span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button 
        onClick={() => alert('오늘의 해석 상세보기를 연동 중입니다.')}
        className="w-full mt-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/95 font-semibold text-xs tracking-wider transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>오늘의 해석 자세히 보기</span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
      </button>
    </div>
  );
}
