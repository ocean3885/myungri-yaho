import FinalDraftComparisonForm from '@/components/admin/FinalDraftComparisonForm';
import { mapFinalDraftComparison } from '@/lib/final-draft-comparison';
import { createAdminClient } from '@/utils/supabase/server';

export default async function AdminFinalDraftsPage() {
  const adminSupabase = await createAdminClient();
  const { data, error } = await adminSupabase
    .from('final_draft_comparisons')
    .select('id, batch_id, draft, system_prompt, user_prompt, provider, model, result_text, status, error_message, duration_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) console.error('Final draft comparison history query failed:', error);

  return (
    <section>
      <div className="mb-5">
        <p className="text-[15px] font-semibold text-[#b06b16]">Final Draft Lab</p>
        <h2 className="mt-1 text-[24px] font-semibold text-[#171553]">최종 상담문 비교</h2>
        <p className="mt-2 max-w-3xl break-keep text-[15px] leading-[1.65] text-[#66594d]">
          같은 상담 초안과 프롬프트를 여러 AI 모델에 전달해 결과를 나란히 비교하고 실행 이력을 저장합니다.
        </p>
      </div>

      <FinalDraftComparisonForm initialHistory={(data || []).map((row) => mapFinalDraftComparison(row))} />
    </section>
  );
}
