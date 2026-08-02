'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, ChevronRight } from 'lucide-react';

export default function HomeRecommend() {
  const cards = [
    {
      title: '내 사주 깊이 읽기',
      desc: '나의 성향과 운의 흐름을 확인해 보세요.',
      img: '/images/card_purple_flower.png',
      tag: '인기',
      alertMsg: '내 사주 깊이 읽기 기능을 연동 중입니다.'
    },
    {
      title: '2026년 흐름 미리보기',
      desc: '다가오는 2026년의 주요 운세를 확인해보세요.',
      img: '/images/card_mountain_sunrise.png',
      alertMsg: '2026년 흐름 미리보기 기능을 연동 중입니다.'
    },
    {
      title: '우리 둘의 궁합 해석',
      desc: '두 사람의 인연과 관계를 명리로 풀어드립니다.',
      img: '/images/card_red_thread.png',
      alertMsg: '우리 둘의 궁합 해석 기능을 연동 중입니다.'
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-extrabold text-[15px] text-zinc-900 tracking-tight font-sans">추천 해석</h3>
        <button 
          onClick={() => alert('전체 추천 목록을 준비 중입니다.')}
          className="text-[11px] text-zinc-400 font-semibold hover:text-zinc-600 transition flex items-center cursor-pointer"
        >
          <span>전체 보기</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Cards list */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-0.5">
        {cards.map((card, idx) => (
          <div 
            key={idx}
            onClick={() => alert(card.alertMsg)}
            className="flex-shrink-0 w-36 h-48 rounded-2xl overflow-hidden relative shadow-sm border border-zinc-150/40 hover:scale-[1.01] transition cursor-pointer"
          >
            <Image 
              src={card.img}
              alt={card.title}
              fill
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000]/10 to-[#000]/60 z-10 flex flex-col justify-between p-4">
              {card.tag ? (
                <span className="inline-flex self-start px-2 py-0.5 bg-white/20 backdrop-blur-xs text-white text-[9px] font-bold rounded-md">
                  {card.tag}
                </span>
              ) : (
                <span />
              )}
              <div className="text-left text-white mt-auto">
                <h4 className="font-bold text-xs leading-tight">{card.title}</h4>
                <p className="text-[9px] text-white/80 mt-1 font-light leading-normal">{card.desc}</p>
                <button className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-3">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
