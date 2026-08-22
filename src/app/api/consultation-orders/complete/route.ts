import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  const { paymentId } = await request.json().catch(() => ({}));
  if (typeof paymentId !== 'string' || !paymentId) return NextResponse.json({ message: '결제번호가 없습니다.' }, { status: 400 });

  const db = await createAdminClient();
  const { data: order } = await db.from('consultation_payment_orders').select('*').eq('payment_id', paymentId).eq('user_id', session.user.id).maybeSingle();
  if (!order) return NextResponse.json({ message: '주문을 찾을 수 없습니다.' }, { status: 404 });
  if (order.status === 'paid' || order.status === 'used') return NextResponse.json({ paymentId, status: order.status });
  if (order.status !== 'pending') return NextResponse.json({ message: '처리할 수 없는 주문 상태입니다.' }, { status: 409 });
  if (!process.env.PORTONE_API_KEY) return NextResponse.json({ message: '포트원 API 키가 설정되지 않았습니다.' }, { status: 503 });

  const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `PortOne ${process.env.PORTONE_API_KEY}` },
    cache: 'no-store',
  });
  if (!response.ok) return NextResponse.json({ message: '결제 정보를 확인하지 못했습니다.' }, { status: 502 });
  const payment = await response.json();
  if (payment.status !== 'PAID' || payment.amount?.total !== order.price_krw || payment.currency !== 'KRW') {
    return NextResponse.json({ message: '결제 상태 또는 금액이 주문과 일치하지 않습니다.' }, { status: 400 });
  }

  const { error } = await db.from('consultation_payment_orders').update({
    status: 'paid',
    portone_transaction_id: payment.transactionId || null,
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', order.id).eq('status', 'pending');
  if (error) return NextResponse.json({ message: '결제 승인 저장에 실패했습니다.' }, { status: 500 });
  return NextResponse.json({ paymentId, status: 'paid' });
}
