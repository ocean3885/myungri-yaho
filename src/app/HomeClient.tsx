'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';

// Subcomponents import
import HomeHeader from '@/components/home/HomeHeader';
import HomeHero from '@/components/home/HomeHero';
import HomeFortuneCard from '@/components/home/HomeFortuneCard';
import HomeQuickMenu from '@/components/home/HomeQuickMenu';
import HomeAskYaho from '@/components/home/HomeAskYaho';
import HomeRecommend from '@/components/home/HomeRecommend';
import HomeRecent from '@/components/home/HomeRecent';
import HomeBottomNav from '@/components/home/HomeBottomNav';

type UserSession = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type Props = {
  user: UserSession | null;
  initialConsultations: any[];
  fortuneData?: {
    score: number;
    wealth: number;
    relation: number;
    health: number;
    phrase: string;
  };
};

export default function HomeClient({ user, initialConsultations, fortuneData }: Props) {
  const [activeTab, setActiveTab] = useState('home');
  const [question, setQuestion] = useState('');
  const [consultations, setConsultations] = useState<any[]>(initialConsultations);
  const [submitting, setSubmitting] = useState(false);

  // Fallback fortune data for guest users
  const defaultFortune = {
    score: 82,
    wealth: 74,
    relation: 89,
    health: 68,
    phrase: '결정을 서두르기보다 한 번 더 확인하는 것이 좋은 날이에요.'
  };

  const fortune = fortuneData || defaultFortune;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    if (!user) {
      alert('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
      window.location.href = '/auth/signin';
      return;
    }

    setSubmitting(true);

    try {
      const dummyBaziResult = {
        four_pillars: {
          year: { gan: { kr: '丙' }, ji: { kr: '寅' } },
          month: { gan: { kr: '辛' }, ji: { kr: '卯' } },
          day: { gan: { kr: '甲' }, ji: { kr: '子' } },
          time: { gan: { kr: '戊' }, ji: { kr: '辰' } },
        },
        meta: { gender: '남자' }
      };

      const response = await fetch('/api/bazi/user-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: question.slice(0, 10),
          result: dummyBaziResult,
          birthParams: {
            year: '1986',
            month: '3',
            day: '12',
            hour: '8',
            min: '30',
            sl: '양력',
            gen: '남'
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '상담 신청에 실패했습니다.');
      }

      alert('상담이 신청되었습니다! 백그라운드에서 해설 생성이 완료되면 최근 상담 내역에 업데이트됩니다.');
      
      const newItem = {
        id: data.id,
        subject_name: question.slice(0, 10),
        status: 'pending',
        request_date_kst: new Date().toISOString().slice(0, 10),
        result_text: '해설을 준비하고 있습니다...'
      };
      setConsultations([newItem, ...consultations]);
      setQuestion('');
    } catch (err: any) {
      alert(err.message || '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a1a] flex justify-center w-full">
      {/* Centered mobile-width container */}
      <div className="w-full max-w-[480px] min-h-screen bg-[#0c0a1a] flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* Content Area */}
        <div className="flex-1 pb-28">
          
          {/* Top Hero Section (Dark Blue Backdrop) */}
          <div className="relative pt-8 pb-10 px-6 overflow-hidden">
            {/* 1. Header */}
            <HomeHeader user={user} signOut={signOut} />

            {/* 2. Hero banner */}
            <HomeHero user={user} />

            {/* 3. Today's Flow Fortune Card */}
            <HomeFortuneCard fortune={fortune} />
          </div>

          {/* Warm Beige / Cream Bottom sheet container */}
          <div className="bg-[#f8f7f4] rounded-t-[32px] px-6 pt-8 pb-4 text-zinc-900 flex-1 -mt-4 relative z-10">
            {/* 4. Quick menus */}
            <HomeQuickMenu />

            {/* 5. Ask AI input */}
            <HomeAskYaho 
              question={question} 
              setQuestion={setQuestion} 
              handleAsk={handleAsk} 
              submitting={submitting} 
            />

            {/* 6. Recommend interpretations */}
            <HomeRecommend />

            {/* 7. Recent consultation list */}
            <HomeRecent consultations={consultations} />
          </div>

        </div>

        {/* 8. Bottom Nav Tab Bar */}
        <HomeBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      </div>
    </div>
  );
}
