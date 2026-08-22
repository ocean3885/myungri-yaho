import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { policyEffectiveDate, siteInfo } from '@/lib/site-info';

export const metadata: Metadata = { title: `환불정책 | ${siteInfo.serviceName}` };

export default function RefundPolicyPage() {
  return <LegalPage
    title="취소·환불 정책"
    description="건별로 결제하는 디지털 상담 콘텐츠의 청약철회 및 환불 기준을 안내합니다."
    effectiveDate={policyEffectiveDate}
    sections={[
      { title: '1. 청약철회 가능 기간', content: <p>구매자는 계약내용에 관한 서면을 받은 날(공급이 더 늦게 시작된 경우에는 공급이 시작된 날)부터 7일 이내에 청약철회를 요청할 수 있습니다.</p> },
      { title: '2. 상담 시작 전 취소', content: <p>결제가 완료되었더라도 AI 상담 생성이 시작되지 않은 경우에는 고객센터를 통해 결제 취소를 요청할 수 있습니다. 승인된 취소는 원 결제수단으로 전액 처리합니다.</p> },
      { title: '3. 디지털 콘텐츠 제공이 시작된 경우', content: <p>결제 후 이용자의 동의에 따라 AI 상담 생성이 시작된 경우 해당 디지털 콘텐츠의 제공이 개시된 것으로 보아 청약철회가 제한될 수 있습니다. 다만 표시·광고 또는 계약내용과 다르게 제공된 경우에는 공급받은 날부터 3개월 이내 또는 그 사실을 안 날부터 30일 이내에 청약철회를 요청할 수 있습니다.</p> },
      { title: '4. 회사 귀책 및 중복 결제', content: <p>회사의 오류로 상담 콘텐츠가 정상적으로 생성되지 않은 경우 결제를 자동 취소하며, 자동 취소가 실패한 경우 고객센터에서 확인 후 처리합니다. 중복 결제가 확인된 경우에도 중복된 결제 건을 취소합니다. 확인을 위해 주문번호와 결제 내역을 요청할 수 있습니다.</p> },
      { title: '5. 환불 신청 방법', content: <><p>고객센터 이메일 {siteInfo.customerServiceEmail} 또는 전화 {siteInfo.customerServicePhone}로 계정 이메일, 주문번호, 결제일시, 환불 사유를 보내주세요.</p><p>환불이 승인되면 관계 법령에 따른 기한 내에 원 결제수단으로 처리합니다. 카드사 등 결제사업자의 사정에 따라 실제 반영까지 추가 시간이 걸릴 수 있습니다.</p></> },
      { title: '6. 유의사항', content: <p>결제수단의 도용 등 부정 결제가 의심되는 경우 확인을 위해 처리가 보류될 수 있습니다. 본 정책에 정하지 않은 사항은 전자상거래 등에서의 소비자보호에 관한 법률 등 관계 법령에 따릅니다.</p> },
    ]}
  />;
}
