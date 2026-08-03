'use client';

import { useState } from 'react';

import HomeBottomNav from '@/components/home/HomeBottomNav';
import HomeHeader from '@/components/home/HomeHeader';
import HomeHero from '@/components/home/HomeHero';
import HomePersonSelector from '@/components/home/HomePersonSelector';
import HomeQuickMenu from '@/components/home/HomeQuickMenu';
import HomeRecent from '@/components/home/HomeRecent';

type UserSession = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type ConsultationItem = {
  id: string;
  subject_name: string;
  status: string;
  request_date_kst: string;
  result_text?: string;
};

type Props = {
  user: UserSession | null;
  initialConsultations: ConsultationItem[];
};

export default function HomeClient({ user, initialConsultations }: Props) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="flex min-h-screen w-full justify-center bg-[#FEFAF5] text-[#121225]">
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#FEFAF5] shadow-[0_0_45px_rgba(47,34,17,0.12)]">
        <main className="relative z-10 flex-1 px-6 pb-28 pt-7">
          <HomeHeader />
          {user && <HomePersonSelector user={user} consultations={initialConsultations} />}
          <HomeHero user={user} consultations={initialConsultations} />
          <HomeRecent consultations={initialConsultations} />
          <HomeQuickMenu />
        </main>

        <HomeBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
