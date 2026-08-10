import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';

export type AdminAccess = {
  userId: string;
  email: string | null;
  name: string | null;
  role: string;
};

export async function getAdminAccess(): Promise<AdminAccess | null> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const adminSupabase = await createAdminClient();
  const { data, error } = await adminSupabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', userId)
    .maybeSingle();

  if (error || data?.role !== 'admin') {
    if (error) {
      console.error('Admin access query failed:', error);
    }
    return null;
  }

  return {
    userId: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
  };
}
