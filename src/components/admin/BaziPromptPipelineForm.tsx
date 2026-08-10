'use client';

import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  BAZI_PROMPT_SETTING_PREFIX,
  DEFAULT_BAZI_CONSULTATION_TYPE,
  getBaziPromptSettingKey,
  normalizeBaziConsultationType,
  type BaziPromptPipelineConfig,
  type BaziPromptSetting,
} from '@/lib/bazi-prompt-config';

type Props = {
  settings: BaziPromptSetting[];
  defaultConfig: BaziPromptPipelineConfig;
};

type SaveStatus = {
  type: 'success' | 'error';
  message: string;
} | null;

export default function BaziPromptPipelineForm({ settings, defaultConfig }: Props) {
  const router = useRouter();
  const [promptSettings, setPromptSettings] = useState(settings);
  const [selectedKey, setSelectedKey] = useState(settings[0]?.key || getBaziPromptSettingKey(DEFAULT_BAZI_CONSULTATION_TYPE));
  const [selectedTypeDraft, setSelectedTypeDraft] = useState(settings[0]?.consultationType || DEFAULT_BAZI_CONSULTATION_TYPE);
  const [newConsultationType, setNewConsultationType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>(null);

  const selectedSetting = useMemo(() => (
    promptSettings.find((setting) => setting.key === selectedKey) || promptSettings[0]
  ), [promptSettings, selectedKey]);

  const formConfig = selectedSetting?.config || defaultConfig;
  const normalizedSelectedTypeDraft = normalizeBaziConsultationType(selectedTypeDraft);
  const selectedTypeDraftKey = getBaziPromptSettingKey(normalizedSelectedTypeDraft);
  const normalizedNewType = normalizeBaziConsultationType(newConsultationType);
  const newSettingKey = getBaziPromptSettingKey(normalizedNewType);
  const canRename = Boolean(selectedSetting)
    && selectedTypeDraft.trim().length > 0
    && selectedTypeDraftKey !== selectedSetting?.key
    && !promptSettings.some((setting) => setting.key === selectedTypeDraftKey);
  const canCreate = newConsultationType.trim().length > 0
    && !promptSettings.some((setting) => setting.key === newSettingKey);

  async function createSetting() {
    if (isSaving || !canCreate) return;

    const nextConfig = {
      ...defaultConfig,
      version: `${normalizedNewType}-v1`,
    };

    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch('/api/admin/bazi-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationType: normalizedNewType,
          config: nextConfig,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '상담종류 프롬프트 추가에 실패했습니다.');
      }

      const createdSetting: BaziPromptSetting = {
        key: data.key,
        consultationType: data.consultationType,
        config: data.config,
        updatedAt: null,
      };

      setPromptSettings((current) => [...current, createdSetting].sort((a, b) => a.key.localeCompare(b.key)));
      setSelectedKey(createdSetting.key);
      setNewConsultationType('');
      setStatus({ type: 'success', message: data.message || '상담종류 프롬프트를 추가했습니다.' });
      router.refresh();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '상담종류 프롬프트 추가에 실패했습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function saveConfig(intent: 'save' | 'reset') {
    if (isSaving || !selectedSetting) return;

    const nextConfig = intent === 'reset'
      ? { ...defaultConfig, version: `${selectedSetting.consultationType}-v1` }
      : formConfig;

    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch('/api/admin/bazi-prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: selectedSetting.key,
          intent,
          config: nextConfig,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '프롬프트 설정 저장에 실패했습니다.');
      }

      updateSelectedSetting({
        config: data.config || nextConfig,
        updatedAt: new Date().toISOString(),
      });
      setStatus({ type: 'success', message: data.message || '프롬프트 설정을 저장했습니다.' });
      router.refresh();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '프롬프트 설정 저장에 실패했습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function renameSetting() {
    if (isSaving || !selectedSetting || !canRename) return;

    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch('/api/admin/bazi-prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: selectedSetting.key,
          intent: 'rename',
          consultationType: normalizedSelectedTypeDraft,
          config: formConfig,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '상담종류 key 변경에 실패했습니다.');
      }

      const renamedSetting: BaziPromptSetting = {
        key: data.key,
        consultationType: data.consultationType,
        config: data.config,
        updatedAt: new Date().toISOString(),
      };

      setPromptSettings((current) => [
        ...current.filter((setting) => setting.key !== selectedSetting.key),
        renamedSetting,
      ].sort((a, b) => a.key.localeCompare(b.key)));
      setSelectedKey(renamedSetting.key);
      setStatus({ type: 'success', message: data.message || '상담종류 key를 변경했습니다.' });
      router.refresh();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '상담종류 key 변경에 실패했습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSetting() {
    if (isSaving || !selectedSetting) return;

    const confirmed = window.confirm(`${selectedSetting.key} 프롬프트 설정을 삭제할까요?`);
    if (!confirmed) return;

    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/bazi-prompts?key=${encodeURIComponent(selectedSetting.key)}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '프롬프트 설정 삭제에 실패했습니다.');
      }

      const nextSettings = promptSettings.filter((setting) => setting.key !== selectedSetting.key);
      const nextSelected = nextSettings[0];
      setPromptSettings(nextSettings);
      setSelectedKey(nextSelected?.key || getBaziPromptSettingKey(DEFAULT_BAZI_CONSULTATION_TYPE));
      setSelectedTypeDraft(nextSelected?.consultationType || DEFAULT_BAZI_CONSULTATION_TYPE);
      setStatus({ type: 'success', message: data.message || '상담종류 프롬프트를 삭제했습니다.' });
      router.refresh();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '프롬프트 설정 삭제에 실패했습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function updateSelectedSetting(values: Partial<BaziPromptSetting>) {
    if (!selectedSetting) return;

    setPromptSettings((current) => current.map((setting) => (
      setting.key === selectedSetting.key ? { ...setting, ...values } : setting
    )));
  }

  function updateConfig(values: Partial<BaziPromptPipelineConfig>) {
    updateSelectedSetting({
      config: {
        ...formConfig,
        ...values,
      },
    });
  }

  function updateStep(index: number, values: Partial<BaziPromptPipelineConfig['steps'][number]>) {
    updateConfig({
      steps: formConfig.steps.map((step, stepIndex) => (
        stepIndex === index ? { ...step, ...values } : step
      )),
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-[12px] border border-[#ead8c6] bg-white px-4 py-4 shadow-[0_12px_32px_rgba(92,61,25,0.06)]">
        <div>
          <h3 className="text-[22px] font-semibold text-[#171553]">상담종류 key</h3>
          <p className="mt-1 text-[15px] leading-[1.55] text-[#66594d]">
            `{BAZI_PROMPT_SETTING_PREFIX}.상담종류` 규칙으로 저장됩니다.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {promptSettings.map((setting) => (
            <button
              key={setting.key}
              type="button"
              onClick={() => {
                setSelectedKey(setting.key);
                setSelectedTypeDraft(setting.consultationType);
              }}
              className={`w-full rounded-[9px] border px-3 py-3 text-left transition ${
                selectedKey === setting.key
                  ? 'border-[#191450] bg-[#f7f4ff] text-[#171553]'
                  : 'border-[#ead8c6] bg-white text-[#66594d] hover:bg-[#fff8f0]'
              }`}
            >
              <span className="block text-[15px] font-semibold">{setting.consultationType}</span>
              <span className="mt-1 block break-all text-[15px] text-[#8a7a68]">{setting.key}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 border-t border-[#eadfd4] pt-4">
          <label className="block">
            <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">새 상담종류</span>
            <input
              value={newConsultationType}
              onChange={(event) => setNewConsultationType(event.target.value)}
              placeholder="예: relationship"
              className={inputClassName}
            />
          </label>
          <p className="mt-2 break-all text-[15px] leading-[1.5] text-[#8a7a68]">
            생성 key: {newConsultationType.trim() ? newSettingKey : `${BAZI_PROMPT_SETTING_PREFIX}.relationship`}
          </p>
          <button
            type="button"
            onClick={createSetting}
            disabled={isSaving || !canCreate}
            className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] bg-[#191450] px-4 text-[15px] font-semibold text-white transition hover:bg-[#24206a] disabled:cursor-not-allowed disabled:bg-[#cfc8bd]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            추가
          </button>
        </div>
      </aside>

      <section className="rounded-[12px] border border-[#ead8c6] bg-white px-5 py-5 shadow-[0_12px_32px_rgba(92,61,25,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[#eadfd4] pb-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="break-all text-[15px] font-semibold text-[#b06b16]">{selectedSetting?.key}</p>
            <h3 className="mt-1 text-[22px] font-semibold text-[#171553]">프롬프트 파이프라인 설정</h3>
            <p className="mt-2 max-w-3xl text-[15px] leading-[1.65] text-[#66594d]">
              여러 분석 프롬프트를 실행한 뒤 최종 편집 프롬프트에서 하나의 상담문으로 통합합니다.
            </p>
            <p className="mt-2 max-w-5xl text-[15px] leading-[1.6] text-[#8a7a68]">
              사용 가능 변수: {'{{baziSummary}}'}, {'{{gender}}'}, {'{{yearPillar}}'}, {'{{monthPillar}}'}, {'{{dayPillar}}'}, {'{{timePillar}}'}, {'{{currentYear}}'}, {'{{previousDaewoon}}'}, {'{{previousDaewoonYearRange}}'}, {'{{currentDaewoon}}'}, {'{{currentDaewoonYearRange}}'}, {'{{nextDaewoon}}'}, {'{{nextDaewoonYearRange}}'}, {'{{currentSewoon}}'}, {'{{previousStepResults}}'}, {'{{stepResults}}'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => saveConfig('reset')}
              disabled={isSaving || !selectedSetting}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-[9px] border border-[#ead8c6] bg-white px-4 text-[15px] font-semibold text-[#66594d] transition hover:bg-[#fff8f0] disabled:cursor-wait disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              기본값 복원
            </button>
            <button
              type="button"
              onClick={() => saveConfig('save')}
              disabled={isSaving || !selectedSetting}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-[9px] bg-[#191450] px-4 text-[15px] font-semibold text-white transition hover:bg-[#24206a] disabled:cursor-wait disabled:bg-[#cfc8bd]"
            >
              <Save className="h-4 w-4" strokeWidth={2} />
              {isSaving ? '저장 중' : '저장'}
            </button>
            <button
              type="button"
              onClick={deleteSetting}
              disabled={isSaving || !selectedSetting}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-[9px] border border-[#f0c7ba] bg-[#fff2ec] px-4 text-[15px] font-semibold text-[#a05738] transition hover:bg-[#ffe8de] disabled:cursor-wait disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              삭제
            </button>
          </div>
        </div>

        {status && (
          <p className={`mt-4 rounded-[9px] px-3 py-2 text-[15px] leading-[1.55] ${
            status.type === 'success'
              ? 'border border-[#cfe7d2] bg-[#eef8ef] text-[#357247]'
              : 'border border-[#f0c7ba] bg-[#fff2ec] text-[#a05738]'
          }`}>
            {status.message}
          </p>
        )}

        <div className="mt-5 rounded-[10px] border border-[#eee2d6] bg-[#fffdf9] px-4 py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">상담종류 key 수정</span>
              <input
                value={selectedTypeDraft}
                onChange={(event) => setSelectedTypeDraft(event.target.value)}
                className={inputClassName}
              />
            </label>
            <button
              type="button"
              onClick={renameSetting}
              disabled={isSaving || !canRename}
              className="flex h-11 cursor-pointer items-center justify-center rounded-[9px] border border-[#191450] bg-white px-4 text-[15px] font-semibold text-[#191450] transition hover:bg-[#FEFAF5] disabled:cursor-not-allowed disabled:border-[#d8cec4] disabled:text-[#9a9088]"
            >
              key 변경
            </button>
          </div>
          <p className="mt-2 break-all text-[15px] leading-[1.5] text-[#8a7a68]">
            변경될 key: {selectedTypeDraftKey}
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px_220px_160px]">
          <TextInput
            label="버전"
            value={formConfig.version}
            onChange={(value) => updateConfig({ version: value })}
          />
          <TextInput
            label="모델"
            value={formConfig.model}
            onChange={(value) => updateConfig({ model: value })}
          />
          <label className="block">
            <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">실행 방식</span>
            <select
              value={formConfig.executionMode}
              onChange={(event) => updateConfig({
                executionMode: event.target.value === 'sequential' ? 'sequential' : 'parallel',
              })}
              className={inputClassName}
            >
              <option value="parallel">병렬 실행</option>
              <option value="sequential">순차 실행</option>
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-[15px] font-semibold text-[#66594d]">
            <input
              type="checkbox"
              checked={formConfig.enabled}
              onChange={(event) => updateConfig({ enabled: event.target.checked })}
              className="h-4 w-4 rounded border-[#ead8c6]"
            />
            파이프라인 사용
          </label>
        </div>

        <div className="mt-5 grid gap-4">
          {formConfig.steps.map((step, index) => (
            <section key={`${step.key}-${index}`} className="rounded-[10px] border border-[#eee2d6] bg-[#fffdf9] px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid flex-1 gap-3 md:grid-cols-[200px_1fr]">
                  <TextInput
                    label="단계 키"
                    value={step.key}
                    onChange={(value) => updateStep(index, { key: value })}
                  />
                  <TextInput
                    label="단계 이름"
                    value={step.label}
                    onChange={(value) => updateStep(index, { label: value })}
                  />
                </div>
                <label className="flex h-11 items-center gap-2 text-[15px] font-semibold text-[#66594d]">
                  <input
                    type="checkbox"
                    checked={step.enabled}
                    onChange={(event) => updateStep(index, { enabled: event.target.checked })}
                    className="h-4 w-4 rounded border-[#ead8c6]"
                  />
                  사용
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Textarea
                  label="System Prompt"
                  value={step.systemPrompt}
                  rows={7}
                  onChange={(value) => updateStep(index, { systemPrompt: value })}
                />
                <Textarea
                  label="User Prompt Template"
                  value={step.userPromptTemplate}
                  rows={7}
                  onChange={(value) => updateStep(index, { userPromptTemplate: value })}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <NumberInput
                  label="Temperature"
                  value={step.temperature}
                  step="0.05"
                  min="0"
                  max="2"
                  onChange={(value) => updateStep(index, { temperature: value })}
                />
                <NumberInput
                  label="Max Tokens"
                  value={step.maxTokens}
                  step="100"
                  min="256"
                  max="8000"
                  onChange={(value) => updateStep(index, { maxTokens: value })}
                />
              </div>
            </section>
          ))}
        </div>

        <section className="mt-5 rounded-[10px] border border-[#eee2d6] bg-[#fffdf9] px-4 py-4">
          <h4 className="text-[22px] font-semibold text-[#171553]">최종 통합 편집</h4>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Textarea
              label="Finalize System Prompt"
              value={formConfig.finalize.systemPrompt}
              rows={7}
              onChange={(value) => updateConfig({
                finalize: { ...formConfig.finalize, systemPrompt: value },
              })}
            />
            <Textarea
              label="Finalize User Prompt Template"
              value={formConfig.finalize.userPromptTemplate}
              rows={7}
              onChange={(value) => updateConfig({
                finalize: { ...formConfig.finalize, userPromptTemplate: value },
              })}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberInput
              label="Temperature"
              value={formConfig.finalize.temperature}
              step="0.05"
              min="0"
              max="2"
              onChange={(value) => updateConfig({
                finalize: { ...formConfig.finalize, temperature: value },
              })}
            />
            <NumberInput
              label="Max Tokens"
              value={formConfig.finalize.maxTokens}
              step="100"
              min="256"
              max="8000"
              onChange={(value) => updateConfig({
                finalize: { ...formConfig.finalize, maxTokens: value },
              })}
            />
          </div>
        </section>
      </section>
    </div>
  );
}

const inputClassName = 'h-11 w-full rounded-[9px] border border-[#ead8c6] bg-white px-3 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]';

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: string;
  max: string;
  step: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputClassName}
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-[9px] border border-[#ead8c6] bg-white px-3 py-3 font-mono text-[15px] leading-7 text-[#111111] outline-none transition focus:border-[#191450]"
      />
    </label>
  );
}
