'use client';

import { Clock3, LoaderCircle, Play, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  DEFAULT_FINAL_SYSTEM_PROMPT,
  DEFAULT_FINAL_USER_PROMPT,
  FINAL_DRAFT_PROVIDERS,
  type FinalDraftComparison,
  type FinalDraftProvider,
} from '@/lib/final-draft-comparison';

type Props = { initialHistory: FinalDraftComparison[] };

const providerLabels: Record<FinalDraftProvider, string> = {
  deepseek: 'DeepSeek',
  openai: 'ChatGPT',
  gemini: 'Gemini',
};

export default function FinalDraftComparisonForm({ initialHistory }: Props) {
  const [draft, setDraft] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_FINAL_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_FINAL_USER_PROMPT);
  const [providers, setProviders] = useState<FinalDraftProvider[]>([...FINAL_DRAFT_PROVIDERS]);
  const [history, setHistory] = useState(initialHistory);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(initialHistory[0]?.batchId || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const groupedHistory = useMemo(() => {
    const groups = new Map<string, FinalDraftComparison[]>();
    history.forEach((item) => groups.set(item.batchId, [...(groups.get(item.batchId) || []), item]));
    return [...groups.entries()];
  }, [history]);

  const activeResults = activeBatchId ? history.filter((item) => item.batchId === activeBatchId) : [];

  function toggleProvider(provider: FinalDraftProvider) {
    setProviders((current) => current.includes(provider)
      ? current.filter((item) => item !== provider)
      : [...current, provider]);
  }

  async function generate() {
    if (isGenerating) return;
    setIsGenerating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/final-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft, systemPrompt, userPrompt, providers }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '최종본 비교 실행에 실패했습니다.');

      const results = Array.isArray(data.results) ? data.results as FinalDraftComparison[] : [];
      setHistory((current) => [...results, ...current].slice(0, 60));
      setActiveBatchId(data.batchId);
      setMessage({ type: 'success', text: data.message || '비교 결과를 저장했습니다.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '최종본 비교 실행에 실패했습니다.' });
    } finally {
      setIsGenerating(false);
    }
  }

  function loadHistoryBatch(items: FinalDraftComparison[]) {
    const item = items[0];
    if (!item) return;
    setDraft(item.draft);
    setSystemPrompt(item.systemPrompt);
    setUserPrompt(item.userPrompt);
    setProviders(items.map((result) => result.provider));
    setActiveBatchId(item.batchId);
    setMessage(null);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <section className="rounded-[12px] border border-[#ead8c6] bg-white p-5 shadow-[0_12px_32px_rgba(92,61,25,0.06)]">
          <Textarea label="상담 초안" value={draft} rows={12} placeholder="분석 Flow에서 생성된 상담 초안을 붙여 넣으세요." onChange={setDraft} />

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Textarea label="최종본 System Prompt" value={systemPrompt} rows={10} onChange={setSystemPrompt} />
            <Textarea label="최종본 User Prompt" note="{{draft}} 위치에 상담 초안이 삽입됩니다." value={userPrompt} rows={10} onChange={setUserPrompt} />
          </div>

          <fieldset className="mt-5">
            <legend className="text-[15px] font-semibold text-[#66594d]">사용할 API</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {FINAL_DRAFT_PROVIDERS.map((provider) => {
                const selected = providers.includes(provider);
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => toggleProvider(provider)}
                    aria-pressed={selected}
                    className={`h-10 rounded-[9px] border px-4 text-[14px] font-semibold transition ${selected ? 'border-[#191450] bg-[#191450] text-white' : 'border-[#ead8c6] bg-white text-[#66594d] hover:bg-[#fff8f0]'}`}
                  >
                    {providerLabels[provider]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {message && (
            <p className={`mt-4 rounded-[9px] px-4 py-3 text-[14px] ${message.type === 'success' ? 'bg-[#edf8ef] text-[#2f6b3a]' : 'bg-[#fff0ec] text-[#a14c35]'}`}>
              {message.text}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generate}
              disabled={isGenerating || !draft.trim() || !systemPrompt.trim() || !userPrompt.trim() || providers.length === 0}
              className="flex h-11 items-center gap-2 rounded-[9px] bg-[#191450] px-5 text-[14px] font-semibold text-white transition hover:bg-[#24206a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isGenerating ? '최종본 생성 중...' : '최종본 생성'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSystemPrompt(DEFAULT_FINAL_SYSTEM_PROMPT);
                setUserPrompt(DEFAULT_FINAL_USER_PROMPT);
              }}
              disabled={isGenerating}
              className="flex h-11 items-center gap-2 rounded-[9px] border border-[#ead8c6] bg-white px-4 text-[14px] font-semibold text-[#66594d] transition hover:bg-[#fff8f0] disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              기본 프롬프트
            </button>
          </div>
        </section>

        {activeResults.length > 0 && (
          <section>
            <h3 className="mb-3 text-[20px] font-semibold text-[#171553]">비교 결과</h3>
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {activeResults.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="h-fit rounded-[12px] border border-[#ead8c6] bg-white p-4 shadow-[0_12px_32px_rgba(92,61,25,0.06)] xl:sticky xl:top-5">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-[#b06b16]" />
          <h3 className="text-[19px] font-semibold text-[#171553]">비교 이력</h3>
        </div>
        <p className="mt-1 text-[13px] text-[#847568]">최근 실행 결과를 불러와 다시 비교할 수 있습니다.</p>
        <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto pr-1">
          {groupedHistory.length === 0 && <p className="py-8 text-center text-[14px] text-[#9a8c7f]">저장된 이력이 없습니다.</p>}
          {groupedHistory.map(([batchId, items]) => (
            <button
              key={batchId}
              type="button"
              onClick={() => loadHistoryBatch(items)}
              className={`w-full rounded-[9px] border p-3 text-left transition ${activeBatchId === batchId ? 'border-[#8e82c2] bg-[#f5f3ff]' : 'border-[#eee2d6] hover:bg-[#fffaf4]'}`}
            >
              <span className="block truncate text-[14px] font-semibold text-[#332c27]">{items[0]?.draft}</span>
              <span className="mt-1 block text-[12px] text-[#8a7c70]">
                {formatDate(items[0]?.createdAt)} · {items.map((item) => providerLabels[item.provider]).join(', ')}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function ResultCard({ result }: { result: FinalDraftComparison }) {
  return (
    <article className="min-w-0 rounded-[12px] border border-[#e6d9cc] bg-white p-5 shadow-[0_8px_24px_rgba(92,61,25,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#eee5dc] pb-3">
        <div>
          <h4 className="text-[18px] font-semibold text-[#171553]">{providerLabels[result.provider]}</h4>
          <p className="mt-0.5 text-[12px] text-[#8a7c70]">{result.model}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${result.status === 'completed' ? 'bg-[#edf8ef] text-[#2f6b3a]' : 'bg-[#fff0ec] text-[#a14c35]'}`}>
          {result.status === 'completed' ? `${(result.durationMs / 1000).toFixed(1)}초` : '실패'}
        </span>
      </div>
      {result.resultText ? (
        <div className="mt-4 max-h-[680px] overflow-y-auto whitespace-pre-wrap break-words text-[14px] leading-7 text-[#332c27]">{result.resultText}</div>
      ) : (
        <p className="mt-4 rounded-[8px] bg-[#fff0ec] p-3 text-[13px] text-[#a14c35]">{result.errorMessage || '결과를 생성하지 못했습니다.'}</p>
      )}
    </article>
  );
}

function Textarea({ label, note, value, rows, placeholder, onChange }: {
  label: string;
  note?: string;
  value: string;
  rows: number;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex flex-wrap items-baseline gap-2 text-[15px] font-semibold text-[#66594d]">
        {label}
        {note && <span className="text-[11px] font-normal text-[#9a8c7f]">{note}</span>}
      </span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-[9px] border border-[#ead8c6] bg-white px-3 py-3 font-mono text-[14px] leading-7 text-[#111] outline-none transition placeholder:font-sans placeholder:text-[#afa297] focus:border-[#191450]"
      />
    </label>
  );
}

function formatDate(value?: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}
