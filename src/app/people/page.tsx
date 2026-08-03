import React from 'react';
import { auth } from '@/auth';
import PeopleClient from './PeopleClient';

export default async function PeoplePage() {
  const session = await auth();

  return <PeopleClient isAuthenticated={Boolean(session?.user?.id)} />;
}
