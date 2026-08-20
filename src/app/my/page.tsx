import { auth } from '@/auth';
import { getAdminAccess } from '@/lib/admin-access';
import MyClient from './MyClient';

export default async function MyPage() {
  const session = await auth();
  const adminAccess = session?.user ? await getAdminAccess() : null;
  let coinBalance = 0;
  if (session?.user?.id) {
    const { createAdminClient } = await import('@/utils/supabase/server');
    const db = await createAdminClient();
    const { data } = await db.from('coin_wallets').select('balance').eq('user_id', session.user.id).maybeSingle();
    coinBalance = data?.balance ?? 0;
  }

  return (
    <MyClient
      isAuthenticated={Boolean(session?.user)}
      isAdmin={Boolean(adminAccess)}
      userName={session?.user?.name || null}
      userEmail={session?.user?.email || null}
      coinBalance={coinBalance}
    />
  );
}
