import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';
import type { SavedPerson } from '../PeopleClient';
import PeopleManageClient from './PeopleManageClient';

export default async function PeopleManagePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/auth/signin?callbackUrl=/people/manage');
  }

  let people: SavedPerson[] = [];

  try {
    const adminSupabase = await createAdminClient();
    const { data, error } = await adminSupabase
      .from('people')
      .select('id, name, relation, gender, calendar, birth_date, birth_time, birth_params, bazi_result, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      people = data.map((person) => ({
        id: person.id,
        name: person.name,
        relation: person.relation,
        gender: person.gender,
        calendar: person.calendar,
        birthDate: person.birth_date,
        birthTime: person.birth_time,
        birthParams: person.birth_params,
        baziResult: person.bazi_result,
        createdAt: person.created_at,
      }));
    }
  } catch (error) {
    console.error('Failed to load people manage page data:', error);
  }

  return <PeopleManageClient initialPeople={people} />;
}
