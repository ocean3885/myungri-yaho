import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  const { productId } = await request.json().catch(() => ({}));
  const db = await createAdminClient();
  const { data: product } = await db.from('coin_products').select('id, name, price_krw, coin_amount').eq('id', productId).eq('enabled', true).maybeSingle();
  if (!product) return NextResponse.json({ message: '판매 중인 상품이 아닙니다.' }, { status: 400 });
  const paymentId = `coin-${crypto.randomUUID()}`;
  const { data: order, error } = await db.from('payment_orders').insert({ payment_id: paymentId, user_id: session.user.id, product_id: product.id, product_name: product.name, price_krw: product.price_krw, coin_amount: product.coin_amount }).select('id').single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  if (!process.env.NEXT_PUBLIC_PORTONE_STORE_ID || !process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY) return NextResponse.json({ message: '포트원 결제 환경변수가 설정되지 않았습니다.' }, { status: 503 });
  return NextResponse.json({ orderId: order.id, paymentId, orderName: product.name, totalAmount: product.price_krw, storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID, channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY });
}
