export async function cancelPortOnePayment(paymentId: string, reason: string) {
  const apiKey = process.env.PORTONE_API_KEY;
  if (!apiKey) throw new Error('포트원 API 키가 설정되지 않았습니다.');

  const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `PortOne ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(data?.message || '결제 취소 요청에 실패했습니다.');
  }
}
