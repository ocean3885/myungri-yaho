import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getConsultationTypeByKey } from '@/lib/consultation-types';
import { createAdminClient } from '@/utils/supabase/server';
import ConsultationConfirmationClient from './ConsultationConfirmationClient';

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function ConsultationConfirmationPage({ searchParams }: Props) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect('/auth/signin');

  const { type } = await searchParams;
  const adminSupabase = await createAdminClient();
  const [consultationType, userResult, peopleResult] = await Promise.all([
    getConsultationTypeByKey(adminSupabase, type),
    adminSupabase.from('users').select('role').eq('id', userId).maybeSingle(),
    adminSupabase.from('people').select('id, name, relation, gender, calendar, birth_date, birth_time, birth_params, bazi_result').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
  ]);

  if (!consultationType.enabled) redirect('/people');

  const isAdmin = userResult.data?.role === 'admin';

  return (
    <ConsultationConfirmationClient
      consultationType={{
        key: consultationType.key,
        name: consultationType.name,
        description: consultationType.description,
        priceKrw: consultationType.priceKrw,
        subjectCount: consultationType.subjectCount,
      }}
      savedPeople={(peopleResult.data || []).map((person) => ({
        id: person.id,
        name: person.name,
        relation: person.relation,
        gender: person.gender,
        calendar: person.calendar,
        birthDate: person.birth_date,
        birthTime: person.birth_time,
        birthParams: person.birth_params,
        baziResult: person.bazi_result,
      }))}
      isAdmin={isAdmin}
    />
  );
}
