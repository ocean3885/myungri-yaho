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
  const [consultationType, userResult, walletResult] = await Promise.all([
    getConsultationTypeByKey(adminSupabase, type),
    adminSupabase.from('users').select('role').eq('id', userId).maybeSingle(),
    adminSupabase.from('coin_wallets').select('balance').eq('user_id', userId).maybeSingle(),
  ]);

  if (!consultationType.enabled) redirect('/people');

  const isAdmin = userResult.data?.role === 'admin';

  return (
    <ConsultationConfirmationClient
      consultationType={{
        key: consultationType.key,
        name: consultationType.name,
        description: consultationType.description,
        coinPrice: consultationType.coinPrice,
      }}
      balance={walletResult.data?.balance ?? 0}
      isAdmin={isAdmin}
    />
  );
}
