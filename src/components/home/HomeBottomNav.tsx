'use client';

import React from 'react';
import { Home as HomeIcon, MessageSquare, Compass, Archive, User } from 'lucide-react';

type Props = {
  activeTab: string;
  setActiveTab: (val: string) => void;
};

export default function HomeBottomNav({ activeTab, setActiveTab }: Props) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[480px] w-full bg-white border-t border-zinc-100/80 py-2.5 px-4 flex justify-between items-center z-50 shadow-[0_-5px_25px_rgba(0,0,0,0.03)]">
      <button 
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center flex-1 cursor-pointer transition ${activeTab === 'home' ? 'text-indigo-600' : 'text-zinc-400'}`}
      >
        <HomeIcon className="w-5 h-5 stroke-[1.8]" />
        <span className="text-[9px] font-bold mt-1.5">홈</span>
      </button>
      
      <button 
        onClick={() => alert('상담 기능 페이지를 준비 중입니다.')}
        className={`flex flex-col items-center flex-1 cursor-pointer transition ${activeTab === 'consult' ? 'text-indigo-600' : 'text-zinc-400'}`}
      >
        <MessageSquare className="w-5 h-5 stroke-[1.8]" />
        <span className="text-[9px] font-bold mt-1.5">상담</span>
      </button>
      
      <button 
        onClick={() => alert('운세 기능 페이지를 준비 중입니다.')}
        className={`flex flex-col items-center flex-1 cursor-pointer transition ${activeTab === 'fortune' ? 'text-indigo-600' : 'text-zinc-400'}`}
      >
        <Compass className="w-5 h-5 stroke-[1.8]" />
        <span className="text-[9px] font-bold mt-1.5">운세</span>
      </button>
      
      <button 
        onClick={() => alert('보관함 기능 페이지를 준비 중입니다.')}
        className={`flex flex-col items-center flex-1 cursor-pointer transition ${activeTab === 'record' ? 'text-indigo-600' : 'text-zinc-400'}`}
      >
        <Archive className="w-5 h-5 stroke-[1.8]" />
        <span className="text-[9px] font-bold mt-1.5">보관함</span>
      </button>
      
      <button 
        onClick={() => alert('마이 페이지를 준비 중입니다.')}
        className={`flex flex-col items-center flex-1 cursor-pointer transition ${activeTab === 'my' ? 'text-indigo-600' : 'text-zinc-400'}`}
      >
        <User className="w-5 h-5 stroke-[1.8]" />
        <span className="text-[9px] font-bold mt-1.5">MY</span>
      </button>
    </div>
  );
}
