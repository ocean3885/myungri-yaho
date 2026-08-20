import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET() {
  const session = await auth();
  const db = await createAdminClient();
  const { data: products, error } = await db.from('coin_products').select('id, name, price_krw, coin_amount').eq('enabled', true).order('sort_order');
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  let balance = 0;
  if (session?.user?.id) {
    const { data } = await db.from('coin_wallets').select('balance').eq('user_id', session.user.id).maybeSingle();
    balance = data?.balance ?? 0;
  }
  return NextResponse.json({ products, balance, isAuthenticated: Boolean(session?.user?.id) });
}
