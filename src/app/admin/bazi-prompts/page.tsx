import BaziPromptPipelineForm from '@/components/admin/BaziPromptPipelineForm';
import {
  defaultBaziPromptPipelineConfig,
  listBaziPromptSettings,
} from '@/lib/bazi-prompt-config';
import { createAdminClient } from '@/utils/supabase/server';

export default async function AdminBaziPromptsPage() {
  const adminSupabase = await createAdminClient();
  const promptSettings = await listBaziPromptSettings(adminSupabase);

  return (
    <section>
      <div className="mb-5">
        <p className="text-[15px] font-semibold text-[#b06b16]">Prompt Pipeline</p>
        <h2 className="mt-1 text-[24px] font-semibold text-[#171553]">사주 상담 프롬프트</h2>
        <p className="mt-2 max-w-3xl break-keep text-[15px] leading-[1.65] text-[#66594d]">
          상담종류별 분석 단계와 최종 통합 편집 프롬프트를 관리합니다.
        </p>
      </div>

      <BaziPromptPipelineForm
        settings={promptSettings}
        defaultConfig={defaultBaziPromptPipelineConfig}
      />
    </section>
  );
}
