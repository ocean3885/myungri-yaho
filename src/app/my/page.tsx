import { auth } from '@/auth';
import { getAdminAccess } from '@/lib/admin-access';
import MyClient from './MyClient';

export default async function MyPage() {
  const session = await auth();
  const adminAccess = session?.user ? await getAdminAccess() : null;

  return (
    <MyClient
      isAuthenticated={Boolean(session?.user)}
      isAdmin={Boolean(adminAccess)}
      userName={session?.user?.name || null}
      userEmail={session?.user?.email || null}
    />
  );
}
