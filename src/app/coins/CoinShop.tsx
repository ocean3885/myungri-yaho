'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PortOne from '@portone/browser-sdk/v2';
import { Coins } from 'lucide-react';

type Product = { id: string; name: string; price_krw: number; coin_amount: number };

export default function CoinShop({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/coins').then((r) => r.json()).then((data) => { setProducts(data.products || []); setBalance(data.balance || 0); });
    const paymentId = new URLSearchParams(window.location.search).get('paymentId');
    if (paymentId) {
      fetch('/api/coins/orders/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId }) })
        .then(async (response) => {
          const completed = await response.json();
          if (!response.ok) throw new Error(completed.message);
          setBalance(completed.balance);
          window.dispatchEvent(new CustomEvent('coin-balance-updated', { detail: { balance: completed.balance } }));
          setMessage('코인 충전이 완료되었습니다.');
        })
        .catch((error) => setMessage(error instanceof Error ? error.message : '결제 확인에 실패했습니다.'))
        .finally(() => window.history.replaceState({}, '', '/coins'));
    }
  }, []);

  async function completePayment(paymentId: string) {
    const response = await fetch('/api/coins/orders/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId }) });
    const completed = await response.json();
    if (!response.ok) throw new Error(completed.message);
    setBalance(completed.balance); setMessage('코인 충전이 완료되었습니다.');
    window.dispatchEvent(new CustomEvent('coin-balance-updated', { detail: { balance: completed.balance } }));
  }

  async function charge(productId: string) {
    setPending(productId); setMessage('');
    try {
      const orderResponse = await fetch('/api/coins/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.message);
      const payment = await PortOne.requestPayment({ storeId: order.storeId, channelKey: order.channelKey, paymentId: order.paymentId, orderName: order.orderName, totalAmount: order.totalAmount, currency: 'KRW', payMethod: 'CARD', redirectUrl: `${window.location.origin}/coins` });
      if (!payment || payment.code) throw new Error(payment?.message || '결제가 취소되었습니다.');
      await completePayment(order.paymentId);
    } catch (error) { setMessage(error instanceof Error ? error.message : '결제에 실패했습니다.'); }
    finally { setPending(null); }
  }

  return <section className="pt-2">
    <div className="flex items-center justify-between"><div><h1 className="text-[24px] font-semibold text-[#171553]">코인 충전</h1><p className="mt-1 text-[14px] text-[#66594d]">상담에 사용할 코인을 충전하세요.</p></div><div className="text-right"><p className="text-[12px] text-[#8a7a68]">보유 코인</p><p className="text-[22px] font-semibold text-[#171553]">{balance} 코인</p></div></div>
    <div className="mt-6 space-y-3">{products.map((product) => <div key={product.id} className="flex items-center justify-between rounded-[8px] border border-[#ead8c6] bg-white px-4 py-4"><div className="flex items-center gap-3"><Coins className="h-5 w-5 text-[#b06b16]"/><div><p className="font-semibold text-[#171553]">{product.coin_amount} 코인</p><p className="text-[13px] text-[#66594d]">{product.price_krw.toLocaleString()}원</p></div></div>{isAuthenticated ? <button onClick={() => charge(product.id)} disabled={pending !== null} className="h-10 rounded-[8px] bg-[#191450] px-4 text-[14px] font-medium text-white disabled:opacity-50">{pending === product.id ? '결제 중' : '충전'}</button> : <Link href="/auth/signin" className="flex h-10 items-center rounded-[8px] bg-[#191450] px-4 text-[14px] font-medium text-white">로그인</Link>}</div>)}</div>
    {message && <p className="mt-4 text-[13px] text-[#8a4d22]">{message}</p>}
  </section>;
}
