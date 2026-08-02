'use client';

import React from 'react';
import { Send } from 'lucide-react';

type Props = {
  question: string;
  setQuestion: (val: string) => void;
  handleAsk: (e: React.FormEvent) => void;
  submitting: boolean;
};

export default function HomeAskYaho({ question, setQuestion, handleAsk, submitting }: Props) {
  const recommendChips = [
    '그 사람과 다시 만날 수 있을까요?',
    '올해 재물운은 어떤가요?',
    '제 적성에 맞는 직업은?'
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-xs mb-6">
      <h3 className="font-extrabold text-[15px] text-zinc-900 tracking-tight font-sans">야호에게 물어보세요</h3>
      <p className="text-[11px] text-zinc-400 mt-1 font-medium">AI 명리 상담사가 궁금한 고민을 들어드려요.</p>
      
      <form onSubmit={handleAsk} className="relative mt-4 flex items-center">
        <input 
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예) 올해 이직운이 궁금해요"
          className="w-full bg-zinc-50 border border-zinc-100 rounded-full px-5 py-3.5 pr-14 text-zinc-800 text-xs placeholder-zinc-400 focus:border-indigo-400 focus:outline-hidden transition"
        />
        <button 
          type="submit"
          disabled={submitting}
          className="absolute right-2 w-9 h-9 rounded-full bg-[#523be4] disabled:bg-indigo-300 text-white flex items-center justify-center hover:bg-[#432fd0] transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Recommended tags */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {recommendChips.map((chip, idx) => (
          <button 
            key={idx}
            onClick={() => setQuestion(chip)}
            className="text-[10px] font-semibold text-zinc-500 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100/60 rounded-lg px-2.5 py-1.5 transition cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
