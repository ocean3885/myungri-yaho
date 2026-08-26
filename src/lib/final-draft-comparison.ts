export const FINAL_DRAFT_PROVIDERS = ['deepseek', 'openai', 'gemini'] as const;

export type FinalDraftProvider = typeof FINAL_DRAFT_PROVIDERS[number];

export type FinalDraftComparison = {
  id: string;
  batchId: string;
  draft: string;
  systemPrompt: string;
  userPrompt: string;
  provider: FinalDraftProvider;
  model: string;
  resultText: string | null;
  status: 'completed' | 'failed';
  errorMessage: string | null;
  durationMs: number;
  createdAt: string;
};

export const DEFAULT_FINAL_SYSTEM_PROMPT = `당신은 사주 상담 초안을 고객에게 전달할 완성도 높은 최종 상담문으로 편집하는 한국어 전문 에디터입니다.
초안의 명리학적 판단과 근거를 빠뜨리거나 새로 만들어내지 마세요.
반복을 줄이고 문장 흐름을 자연스럽게 연결하며, 따뜻하고 정중한 경어체로 작성하세요.
운명을 단정하거나 공포를 조장하지 말고, 건강·투자·법률 관련 확정적 조언을 피하세요.`;

export const DEFAULT_FINAL_USER_PROMPT = `아래 상담 초안을 고객이 바로 읽을 수 있는 최종 상담문으로 다듬어 주세요.
마크다운 기호나 작업 설명 없이 완성된 상담문만 출력하세요.

{{draft}}`;

export function mapFinalDraftComparison(row: Record<string, unknown>): FinalDraftComparison {
  return {
    id: String(row.id),
    batchId: String(row.batch_id),
    draft: String(row.draft || ''),
    systemPrompt: String(row.system_prompt || ''),
    userPrompt: String(row.user_prompt || ''),
    provider: row.provider as FinalDraftProvider,
    model: String(row.model || ''),
    resultText: typeof row.result_text === 'string' ? row.result_text : null,
    status: row.status === 'failed' ? 'failed' : 'completed',
    errorMessage: typeof row.error_message === 'string' ? row.error_message : null,
    durationMs: Number(row.duration_ms) || 0,
    createdAt: String(row.created_at),
  };
}
