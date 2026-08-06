import React from 'react';
import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';
import PeopleClient from './PeopleClient';
import type { SavedPerson } from './PeopleClient';

export default async function PeoplePage() {
  const session = await auth();
  let initialPeople: SavedPerson[] = [];

  if (session?.user?.id) {
    try {
      const adminSupabase = await createAdminClient();
      const { data, error } = await adminSupabase
        .from('people')
        .select('id, name, relation, gender, calendar, birth_date, birth_time, birth_params, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(30);

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
          createdAt: person.created_at,
        }));
      }
    } catch (error) {
      console.error('Failed to load saved people:', error);
    }
  }

  return <PeopleClient isAuthenticated={Boolean(session?.user?.id)} initialPeople={initialPeople} />;
}
