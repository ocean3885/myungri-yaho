import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getConsultationTypeByKey } from '@/lib/consultation-types';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });

  const { consultationType: typeKey } = await request.json().catch(() => ({}));
  const db = await createAdminClient();
  const consultationType = await getConsultationTypeByKey(db, typeKey);
  if (!consultationType.enabled || consultationType.priceKrw <= 0) {
    return NextResponse.json({ message: '결제할 수 없는 상담 상품입니다.' }, { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_PORTONE_STORE_ID || !process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY) {
    return NextResponse.json({ message: '포트원 결제 환경변수가 설정되지 않았습니다.' }, { status: 503 });
  }

  const paymentId = `consultation-${crypto.randomUUID()}`;
  const { data: order, error } = await db.from('consultation_payment_orders').insert({
    payment_id: paymentId,
    user_id: session.user.id,
    consultation_type_key: consultationType.key,
    product_name: `${consultationType.name} 상담`,
    price_krw: consultationType.priceKrw,
  }).select('id').single();

  if (error) return NextResponse.json({ message: '주문 생성에 실패했습니다.' }, { status: 500 });
  return NextResponse.json({
    orderId: order.id,
    paymentId,
    orderName: `${consultationType.name} 상담`,
    totalAmount: consultationType.priceKrw,
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
    channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
  });
}
