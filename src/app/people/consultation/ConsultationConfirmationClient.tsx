'use client';

import PortOne from '@portone/browser-sdk/v2';
import { ChevronLeft, CreditCard, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { BaziResult } from '@/components/bazi/types';

type ConsultationSubject = { personId?: string; subjectName: string; result: BaziResult; birthParams: BaziResult['birth_params'] };
type ConsultationDraft = ConsultationSubject & { additionalSubjects?: ConsultationSubject[] };
type SavedPerson = {
  id: string; name: string; relation: string; gender: string; calendar: string;
  birthDate: string; birthTime: string | null; birthParams: BaziResult['birth_params']; baziResult: BaziResult;
};
type Props = {
  consultationType: { key: string; name: string; description: string | null; imageUrl: string | null; priceKrw: number; subjectCount: number };
  savedPeople: SavedPerson[];
  isAdmin: boolean;
};
type PaymentOrder = {
  paymentId: string;
  orderName: string;
  totalAmount: number;
  storeId: string;
  channelKey: string;
  customer: { customerId: string; email: string; fullName?: string; phoneNumber: string };
};

function formatPhoneNumberInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function ConsultationConfirmationClient({ consultationType, savedPeople, isAdmin }: Props) {
  const router = useRouter();
  const redirectHandled = useRef(false);
  const [draft, setDraft] = useState<ConsultationDraft | null>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const storedDraft = window.sessionStorage.getItem('bazi-consultation-draft');
        if (storedDraft) {
          const parsed = JSON.parse(storedDraft) as ConsultationDraft;
          if (parsed.result?.four_pillars && parsed.subjectName) {
            setDraft(parsed);
            setSelectedPersonIds([parsed.personId || '', ...(parsed.additionalSubjects?.map((subject) => subject.personId || '') || [])]);
            return;
          }
        }
      } catch { window.sessionStorage.removeItem('bazi-consultation-draft'); }
      setDraft(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!draft || redirectHandled.current) return;
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const paymentId = params.get('paymentId');
      const paymentCode = params.get('code');
      if (!paymentId && !paymentCode) return;
      redirectHandled.current = true;
      window.history.replaceState({}, '', `/people/consultation?type=${encodeURIComponent(consultationType.key)}`);
      if (!paymentId || paymentCode) { setMessage(params.get('message') || '결제가 완료되지 않았습니다.'); return; }
      setIsSubmitting(true);
      completePaymentAndStart(paymentId, draft).catch((error) => {
        setMessage(error instanceof Error ? error.message : '결제 확인에 실패했습니다.');
        setIsSubmitting(false);
      });
    });
    return () => window.cancelAnimationFrame(frame);
  // 결제 리다이렉트는 최초 1회만 처리합니다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, consultationType.key]);

  async function submitConsultation(currentDraft: ConsultationDraft, paymentId?: string) {
    const subjects: ConsultationSubject[] = [currentDraft, ...(currentDraft.additionalSubjects || [])];
    const response = await fetch('/api/bazi/user-consultation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjects, consultationType: consultationType.key, paymentId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '상담 신청에 실패했습니다.');
    window.sessionStorage.removeItem('bazi-consultation-draft');
    router.replace(`/archive/${data.id}`);
  }

  async function completePaymentAndStart(paymentId: string, currentDraft: ConsultationDraft) {
    const response = await fetch('/api/consultation-orders/complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '결제 확인에 실패했습니다.');
    await submitConsultation(currentDraft, paymentId);
  }

  async function confirmConsultation() {
    const preparedDraft = prepareDraft();
    if (!preparedDraft || isSubmitting || (!isAdmin && !agreed)) return;
    setIsSubmitting(true); setMessage('');
    try {
      window.sessionStorage.setItem('bazi-consultation-draft', JSON.stringify(preparedDraft));
      if (isAdmin || consultationType.priceKrw === 0) { await submitConsultation(preparedDraft); return; }
      const orderResponse = await fetch('/api/consultation-orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consultationType: consultationType.key, agreedToImmediateProvision: agreed, customerPhoneNumber }),
      });
      const order = await orderResponse.json() as PaymentOrder & { message?: string };
      if (!orderResponse.ok) throw new Error(order.message || '주문 생성에 실패했습니다.');
      const payment = await PortOne.requestPayment({
        storeId: order.storeId, channelKey: order.channelKey, paymentId: order.paymentId, orderName: order.orderName,
        totalAmount: order.totalAmount, currency: 'KRW', payMethod: 'CARD',
        customer: order.customer,
        redirectUrl: `${window.location.origin}/people/consultation?type=${encodeURIComponent(consultationType.key)}`,
      });
      if (!payment || payment.code) throw new Error(payment?.message || '결제가 취소되었습니다.');
      await completePaymentAndStart(order.paymentId, preparedDraft);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상담 결제에 실패했습니다.');
      setIsSubmitting(false);
    }
  }

  const selectablePeople = savedPeople.filter((person) => person.baziResult?.four_pillars && person.birthParams);
  const selectedIds = Array.from({ length: consultationType.subjectCount }, (_, index) => selectedPersonIds[index] || '');
  const hasAllSubjects = selectedIds.every(Boolean) && new Set(selectedIds).size === selectedIds.length;
  const hasValidPhoneNumber = /^01[016789]\d{7,8}$/.test(customerPhoneNumber.replace(/\D/g, ''));

  function prepareDraft() {
    if (!hasAllSubjects) return null;
    const selectedPeople = selectedIds.map((id) => selectablePeople.find((person) => person.id === id));
    if (selectedPeople.some((person) => !person)) return null;

    const subjects = selectedPeople.filter((person): person is SavedPerson => Boolean(person)).map((person) => ({
      personId: person.id,
      subjectName: person.name,
      result: person.baziResult,
      birthParams: person.birthParams,
    }));

    const [primarySubject, ...additionalSubjects] = subjects;
    return { ...primarySubject, additionalSubjects };
  }

  function updateSelectedPerson(index: number, personId: string) {
    window.sessionStorage.removeItem('bazi-consultation-draft');
    setDraft(null);
    setSelectedPersonIds((current) => Array.from({ length: consultationType.subjectCount }, (_, itemIndex) => itemIndex === index ? personId : current[itemIndex] || ''));
  }

  function getSelectablePeopleForIndex(index: number) {
    return selectablePeople.filter((person) => !selectedIds.some((id, selectedIndex) => selectedIndex !== index && id === person.id));
  }

  return <>
    <header className="flex h-12 items-center justify-between">
      <Link href="/consultations" className="flex h-10 w-10 items-center justify-center rounded-full text-[#171553]" aria-label="상담 선택으로 돌아가기"><ChevronLeft className="h-7 w-7" strokeWidth={2.2} /></Link>
      <h1 className="text-[18px] font-semibold text-[#111111]">상담 신청 확인</h1><span className="h-10 w-10" />
    </header>
    <main className="mt-5 space-y-4">
      <article className="overflow-hidden rounded-[12px] border border-[#ead8c6] bg-white shadow-[0_10px_28px_rgba(58,42,29,0.07)]">
        {consultationType.imageUrl && (
          <div className="relative h-[156px] bg-[#f6efe8]">
            <Image
              src={consultationType.imageUrl}
              alt={`${consultationType.name} 대표 이미지`}
              fill
              priority
              sizes="(min-width: 480px) 430px, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display min-w-0 text-[20px] font-medium leading-[1.45] text-[#171553]">{consultationType.name}</h2>
            <strong className="shrink-0 pt-0.5 text-[16px] text-[#a66c1a]">
              {consultationType.priceKrw === 0 ? '무료' : `${consultationType.priceKrw.toLocaleString('ko-KR')}원`}
            </strong>
          </div>
          {consultationType.description && (
            <p className="mt-2 break-keep text-[13px] leading-[1.7] text-[#66594d]">{consultationType.description}</p>
          )}
          {draft && <p className="mt-4 rounded-[8px] bg-[#FEFAF5] px-3 py-2 text-[13px] text-[#493c31]">상담 대상: <strong>{draft.subjectName}</strong></p>}
        </div>
      </article>

      <section className="rounded-[12px] border border-[#ead8c6] bg-white px-5 py-5">
        <h2 className="text-[16px] font-semibold text-[#171553]">누구의 사주를 살펴볼까요?</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#76695d]">저장된 인물 중 상담할 대상을 선택해주세요. 목록에 없다면 새로 등록할 수 있어요.</p>
        {selectablePeople.length > 0 ? (
          <>
            <div className="mt-4 space-y-3">
              {Array.from({ length: consultationType.subjectCount }, (_, index) => <label key={index} className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#66594d]">{consultationType.subjectCount === 1 ? '상담 인물' : `${index + 1}번째 인물`}</span>
                <select value={selectedIds[index]} onChange={(event) => updateSelectedPerson(index, event.target.value)} className="h-12 w-full rounded-[9px] border border-[#ead8c6] bg-white px-3 text-[14px] text-[#2a2018] outline-none focus:border-[#191450]">
                  <option value="">인물을 선택하세요</option>
                  {getSelectablePeopleForIndex(index).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.relation} · {person.birthDate}</option>)}
                </select>
              </label>)}
            </div>
            {selectablePeople.length < consultationType.subjectCount && <p className="mt-3 rounded-[8px] bg-[#fff2ec] px-3 py-2 text-[12px] leading-5 text-[#a05738]">이 상담에 필요한 인물이 부족합니다. <Link href="/people" className="font-semibold underline">인물 등록 페이지에서 추가로 등록해주세요.</Link></p>}
          </>
        ) : (
          <div className="mt-4 rounded-[10px] border border-dashed border-[#e5d2bd] bg-[#fffdf9] px-4 py-5 text-center">
            <p className="text-[14px] font-semibold text-[#171553]">상담할 인물이 없습니다</p>
            <p className="mt-1 break-keep text-[12px] leading-5 text-[#76695d]">인물 등록 페이지에서 생년월일시를 먼저 저장한 뒤 상담을 진행해주세요.</p>
            <Link href="/people" className="font-display mx-auto mt-4 flex h-10 w-fit items-center justify-center rounded-[9px] bg-[#191450] px-4 text-[13px] font-medium text-white">
              인물 등록하기
            </Link>
          </div>
        )}
      </section>
      <section className="rounded-[12px] border border-[#ead8c6] bg-[#fffaf4] px-5 py-5"><div className="flex items-start gap-3">
        {isAdmin ? <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-[#357247]" /> : <CreditCard className="mt-0.5 h-6 w-6 shrink-0 text-[#b06b16]" />}
        <div><h2 className="text-[16px] font-semibold text-[#2a2018]">{isAdmin ? '운영자 상담' : '최종 결제 금액'}</h2><p className="mt-2 text-[20px] font-bold text-[#171553]">{isAdmin ? '결제 없음' : `${consultationType.priceKrw.toLocaleString('ko-KR')}원`}</p><p className="mt-1 text-[12px] leading-5 text-[#76695d]">{isAdmin ? '운영자 계정은 결제 없이 상담을 진행합니다.' : '선택한 상담 1건의 이용 금액입니다. 결제가 완료되면 상담이 바로 시작됩니다.'}</p></div>
      </div></section>
      {!isAdmin && consultationType.priceKrw > 0 && <label className="block rounded-[10px] border border-[#ead8c6] bg-white px-4 py-4">
        <span className="block text-[13px] font-semibold text-[#352b25]">구매자 휴대폰 번호</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={customerPhoneNumber}
          onChange={(event) => setCustomerPhoneNumber(formatPhoneNumberInput(event.target.value))}
          placeholder="010-1234-5678"
          className="mt-2 h-11 w-full rounded-[9px] border border-[#ead8c6] bg-white px-3 text-[14px] text-[#2a2018] outline-none transition focus:border-[#191450]"
        />
        {customerPhoneNumber && !hasValidPhoneNumber && <span className="mt-1.5 block text-[12px] text-[#a05738]">휴대폰 번호를 정확히 입력해주세요.</span>}
      </label>}
      {!isAdmin && <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-[#ead8c6] bg-white px-4 py-4 text-[12px] leading-5 text-[#61564d]">
        <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1 h-4 w-4 accent-[#191450]" />
        <span><span className="font-semibold text-[#352b25]">[필수] 결제 즉시 AI 상담 콘텐츠 생성 및 제공이 시작되는 것에 동의합니다.</span><br />콘텐츠 제공이 시작된 이후에는 청약철회가 제한될 수 있습니다. 다만, 제공 내용이 표시·광고 또는 계약 내용과 다르면 관련 법령에 따라 청약철회할 수 있습니다. <Link href="/terms" className="font-semibold text-[#6d4bc3] underline">이용약관</Link> · <Link href="/refund-policy" className="font-semibold text-[#6d4bc3] underline">환불정책</Link></span>
      </label>}
      {message && <p className="rounded-[10px] bg-[#fff2ec] px-4 py-3 text-[13px] text-[#a05738]" role="alert">{message}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => router.back()} className="font-display flex h-12 items-center justify-center rounded-[10px] border border-[#191450] bg-white text-[14px] font-medium text-[#191450]">취소</button>
        <button type="button" onClick={confirmConsultation} disabled={!hasAllSubjects || isSubmitting || (!isAdmin && (!agreed || (consultationType.priceKrw > 0 && !hasValidPhoneNumber)))} className="font-display flex h-12 items-center justify-center rounded-[10px] bg-[#191450] px-2 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#cfc8bd]">{isSubmitting ? '처리 중...' : isAdmin ? '상담 시작' : `${consultationType.priceKrw.toLocaleString('ko-KR')}원 결제하기`}</button>
      </div>
    </main>
  </>;
}
