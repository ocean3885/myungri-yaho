'use client';

import React from 'react';
import Image from 'next/image';
import { MessageSquare, ChevronRight } from 'lucide-react';

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
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-extrabold text-[15px] text-zinc-900 tracking-tight font-sans">최근 상담</h3>
        <button 
          onClick={() => alert('전체 상담 목록 페이지를 준비 중입니다.')}
          className="text-[11px] text-zinc-400 font-semibold hover:text-zinc-600 transition flex items-center cursor-pointer"
        >
          <span>전체 보기</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {consultations.length > 0 ? (
        <div className="space-y-3">
          {consultations.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-zinc-100 bg-white hover:shadow-xs transition duration-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-950 flex-shrink-0">
                  <Image 
                    src="/images/yaho_female_helper.png"
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="object-cover scale-110 translate-y-1.5"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-zinc-800 leading-tight">
                    {item.subject_name || '상담 요청 건'}
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-medium mt-1 block">
                    {item.request_date_kst} · {item.status === 'pending' ? '분석 중' : '분석 완료'}
                  </span>
                  <p className="text-xs text-zinc-500 mt-2 font-medium leading-relaxed line-clamp-2">
                    {item.result_text || '해설을 준비하고 있습니다. 잠시만 기다려주세요.'}
                  </p>
                </div>
                <button 
                  onClick={() => alert(item.result_text || '아직 조언이 완료되지 않았습니다.')}
                  className="px-3.5 py-2 rounded-lg border border-purple-200 hover:bg-purple-50 transition text-purple-600 text-xs font-bold flex-shrink-0 cursor-pointer self-end"
                >
                  {item.status === 'pending' ? '대기 중' : '이어하기'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-zinc-400 text-xs bg-white border border-zinc-100 rounded-2xl flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-zinc-300 stroke-[1.5]" />
          </div>
          <div className="text-center">
            <p className="font-bold text-zinc-500 text-xs">최근 상담이 없습니다.</p>
            <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">궁금한 고민을 아호에게 물어보세요.</p>
          </div>
        </div>
      )}
    </div>
  );
}
