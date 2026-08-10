'use client';

import HomeHero from '@/components/home/HomeHero';
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
  return (
    <>
      <HomeHero user={user} consultations={initialConsultations} />
      <HomeRecent consultations={initialConsultations} />
      <HomeQuickMenu />
    </>
  );
}
