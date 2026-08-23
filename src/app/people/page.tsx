import React from 'react';
import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';
import PeopleClient from './PeopleClient';
import type { SavedPerson } from './PeopleClient';

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const session = await auth();
  const { edit } = await searchParams;
  let initialPeople: SavedPerson[] = [];

  try {
    const adminSupabase = await createAdminClient();

    if (session?.user?.id) {
      const { data, error } = await adminSupabase
        .from('people')
        .select('id, name, relation, gender, calendar, birth_date, birth_time, birth_params, bazi_result, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        initialPeople = data.map((person) => ({
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
    }
  } catch (error) {
    console.error('Failed to load people page data:', error);
  }

  return (
    <PeopleClient
      isAuthenticated={Boolean(session?.user?.id)}
      initialPeople={initialPeople}
      editPerson={initialPeople.find((person) => person.id === edit) || null}
    />
  );
}
