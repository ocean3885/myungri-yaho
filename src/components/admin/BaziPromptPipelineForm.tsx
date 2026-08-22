'use client';

import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  BAZI_PROMPT_MAX_TOKENS_LIMIT,
  BAZI_PROMPT_SETTING_PREFIX,
  DEFAULT_BAZI_CONSULTATION_TYPE,
  getBaziPromptSettingKey,
  normalizeBaziConsultationType,
  type BaziPromptPipelineConfig,
  type BaziPromptSetting,
} from '@/lib/bazi-prompt-config';
import { DEEPSEEK_MODELS } from '@/lib/deepseek';

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
  const [newConsultationName, setNewConsultationName] = useState('');
  const [newConsultationDescription, setNewConsultationDescription] = useState('');
  const [newConsultationEnabled, setNewConsultationEnabled] = useState(true);
  const [newConsultationSortOrder, setNewConsultationSortOrder] = useState(100);
  const [newConsultationPriceKrw, setNewConsultationPriceKrw] = useState(990);
  const [newConsultationSubjectCount, setNewConsultationSubjectCount] = useState(1);
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
  const pipelineEnabled = formConfig.enabled;
  const singleStepIndex = formConfig.steps.findIndex((step) => step.enabled) >= 0
    ? formConfig.steps.findIndex((step) => step.enabled)
    : 0;
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
          name: newConsultationName || normalizedNewType,
          description: newConsultationDescription,
          enabled: newConsultationEnabled,
          sortOrder: newConsultationSortOrder,
          priceKrw: newConsultationPriceKrw,
          subjectCount: newConsultationSubjectCount,
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
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        sortOrder: data.sortOrder,
        priceKrw: data.priceKrw,
        subjectCount: data.subjectCount,
        config: data.config,
        updatedAt: null,
      };

      setPromptSettings((current) => [...current, createdSetting].sort(sortPromptSettings));
      setSelectedKey(createdSetting.key);
      setSelectedTypeDraft(createdSetting.consultationType);
      setNewConsultationType('');
      setNewConsultationName('');
      setNewConsultationDescription('');
      setNewConsultationEnabled(true);
      setNewConsultationSortOrder(100);
      setNewConsultationPriceKrw(990);
      setNewConsultationSubjectCount(1);
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
          name: selectedSetting.name,
          description: selectedSetting.description,
          enabled: selectedSetting.enabled,
          sortOrder: selectedSetting.sortOrder,
          priceKrw: selectedSetting.priceKrw,
          subjectCount: selectedSetting.subjectCount,
          config: nextConfig,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '프롬프트 설정 저장에 실패했습니다.');
      }

      updateSelectedSetting({
        config: data.config || nextConfig,
        name: data.name || selectedSetting.name,
        description: data.description ?? selectedSetting.description,
        enabled: typeof data.enabled === 'boolean' ? data.enabled : selectedSetting.enabled,
        sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : selectedSetting.sortOrder,
        priceKrw: typeof data.priceKrw === 'number' ? data.priceKrw : selectedSetting.priceKrw,
        subjectCount: typeof data.subjectCount === 'number' ? data.subjectCount : selectedSetting.subjectCount,
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
          name: selectedSetting.name,
          description: selectedSetting.description,
          enabled: selectedSetting.enabled,
          sortOrder: selectedSetting.sortOrder,
          priceKrw: selectedSetting.priceKrw,
          subjectCount: selectedSetting.subjectCount,
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
        name: data.name || selectedSetting.name,
        description: data.description ?? selectedSetting.description,
        enabled: typeof data.enabled === 'boolean' ? data.enabled : selectedSetting.enabled,
        sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : selectedSetting.sortOrder,
        priceKrw: typeof data.priceKrw === 'number' ? data.priceKrw : selectedSetting.priceKrw,
        subjectCount: typeof data.subjectCount === 'number' ? data.subjectCount : selectedSetting.subjectCount,
        config: data.config,
        updatedAt: new Date().toISOString(),
      };

      setPromptSettings((current) => [
        ...current.filter((setting) => setting.key !== selectedSetting.key),
        renamedSetting,
      ].sort(sortPromptSettings));
      setSelectedKey(renamedSetting.key);
      setSelectedTypeDraft(renamedSetting.consultationType);
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
    )).sort(sortPromptSettings));
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
              <span className="flex items-center justify-between gap-2 text-[15px] font-semibold">
                <span className="truncate">{setting.name}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${setting.enabled ? 'bg-[#eef8ef] text-[#357247]' : 'bg-[#f0ece7] text-[#8a7a68]'}`}>
                  {setting.enabled ? '사용' : '숨김'}
                </span>
              </span>
              <span className="mt-1 block break-all text-[15px] text-[#8a7a68]">{setting.key}</span>
              <span className="mt-1 block text-[13px] font-semibold text-[#b06b16]">{setting.priceKrw === 0 ? '무료' : `${setting.priceKrw.toLocaleString('ko-KR')}원`}</span>
              <span className="mt-0.5 block text-[12px] text-[#8467c8]">필요 인원 {setting.subjectCount}명</span>
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
          <label className="mt-3 block">
            <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">표시 이름</span>
            <input
              value={newConsultationName}
              onChange={(event) => setNewConsultationName(event.target.value)}
              placeholder="예: 연애 상담"
              className={inputClassName}
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">설명</span>
            <textarea
              value={newConsultationDescription}
              onChange={(event) => setNewConsultationDescription(event.target.value)}
              rows={3}
              placeholder="사용자에게 보여줄 상담 설명"
              className={textareaClassName}
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">가격 (원)</span>
            <input
              type="number"
              value={newConsultationPriceKrw}
              onChange={(event) => setNewConsultationPriceKrw(Number(event.target.value))}
              min={0}
              max={10000000}
              step={100}
              className={inputClassName}
            />
            <span className="mt-1 block text-[12px] text-[#8a7a68]">무료 상담은 0원, 유료 상담은 100원 이상</span>
          </label>
          <label className="mt-3 block">
            <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">필요 인원</span>
            <select value={newConsultationSubjectCount} onChange={(event) => setNewConsultationSubjectCount(Number(event.target.value))} className={inputClassName}>
              <option value={1}>1명 (개인 상담)</option>
              <option value={2}>2명 (궁합 상담)</option>
              <option value={3}>3명</option>
              <option value={4}>4명</option>
            </select>
          </label>
          <div className="mt-3 grid grid-cols-[1fr_96px] items-end gap-3">
            <label className="flex h-11 items-center gap-2 text-[15px] font-semibold text-[#66594d]">
              <input
                type="checkbox"
                checked={newConsultationEnabled}
                onChange={(event) => setNewConsultationEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-[#ead8c6]"
              />
              사용자 노출
            </label>
            <label className="block">
              <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">순서</span>
              <input
                type="number"
                value={newConsultationSortOrder}
                onChange={(event) => setNewConsultationSortOrder(Number(event.target.value))}
                min={0}
                max={9999}
                className={inputClassName}
              />
            </label>
          </div>
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
              사용 가능 변수: {'{{baziJson}}'}, {'{{baziSummary}}'}, {'{{subjectsJson}}'}, {'{{subjectsSummary}}'}, {'{{person1Name}}'}, {'{{person1BaziSummary}}'}, {'{{person2Name}}'}, {'{{person2BaziSummary}}'}, {'{{gender}}'}, {'{{yearPillar}}'}, {'{{monthPillar}}'}, {'{{dayPillar}}'}, {'{{timePillar}}'}, {'{{currentYear}}'}, {'{{previousStepResults}}'}, {'{{stepResults}}'}
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

        {selectedSetting && (
          <div className="mt-5 rounded-[10px] border border-[#eee2d6] bg-[#fffdf9] px-4 py-4">
            <h4 className="text-[18px] font-semibold text-[#171553]">상담종류 운영 정보</h4>
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_160px_160px]">
              <TextInput
                label="표시 이름"
                value={selectedSetting.name}
                onChange={(value) => updateSelectedSetting({ name: value })}
              />
              <NumberInput
                label="가격"
                labelNote="원"
                value={selectedSetting.priceKrw}
                step="100"
                min="0"
                max="10000000"
                onChange={(value) => updateSelectedSetting({ priceKrw: value })}
              />
              <NumberInput
                label="정렬 순서"
                value={selectedSetting.sortOrder}
                step="1"
                min="0"
                max="9999"
                onChange={(value) => updateSelectedSetting({ sortOrder: value })}
              />
              <label className="block">
                <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">필요 인원</span>
                <select value={selectedSetting.subjectCount} onChange={(event) => updateSelectedSetting({ subjectCount: Number(event.target.value) })} className={inputClassName}>
                  <option value={1}>1명</option><option value={2}>2명</option><option value={3}>3명</option><option value={4}>4명</option>
                </select>
              </label>
            </div>
            <div className="mt-4">
              <Textarea
                label="설명"
                value={selectedSetting.description || ''}
                rows={3}
                onChange={(value) => updateSelectedSetting({ description: value })}
              />
            </div>
            <label className="mt-4 flex h-11 items-center gap-2 text-[15px] font-semibold text-[#66594d]">
              <input
                type="checkbox"
                checked={selectedSetting.enabled}
                onChange={(event) => updateSelectedSetting({ enabled: event.target.checked })}
                className="h-4 w-4 rounded border-[#ead8c6]"
              />
              사용자 화면에 노출
            </label>
          </div>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px_220px_160px]">
          <TextInput
            label="버전"
            value={formConfig.version}
            onChange={(value) => updateConfig({ version: value })}
          />
          <label className="block">
            <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">모델</span>
            <select
              value={formConfig.model}
              onChange={(event) => updateConfig({ model: event.target.value })}
              className={inputClassName}
            >
              {!DEEPSEEK_MODELS.some((model) => model.id === formConfig.model) && (
                <option value={formConfig.model}>
                  {formConfig.model || '모델 미지정'} (현재 지원 목록에 없음)
                </option>
              )}
              {DEEPSEEK_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label} — {model.description}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">실행 방식</span>
            <select
              value={formConfig.executionMode}
              onChange={(event) => updateConfig({
                executionMode: event.target.value === 'sequential' ? 'sequential' : 'parallel',
              })}
              disabled={!pipelineEnabled}
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
            <section
              key={`${step.key}-${index}`}
              className={`rounded-[10px] border border-[#eee2d6] px-4 py-4 transition ${
                !pipelineEnabled && index !== singleStepIndex ? 'bg-[#f7f3ee] opacity-60' : 'bg-[#fffdf9]'
              }`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid flex-1 gap-3 md:grid-cols-[200px_1fr]">
                  <TextInput
                    label="단계 키"
                    value={step.key}
                    disabled={!pipelineEnabled && index !== singleStepIndex}
                    onChange={(value) => updateStep(index, { key: value })}
                  />
                  <TextInput
                    label="단계 이름"
                    value={step.label}
                    disabled={!pipelineEnabled && index !== singleStepIndex}
                    onChange={(value) => updateStep(index, { label: value })}
                  />
                </div>
                <label className="flex h-11 items-center gap-2 text-[15px] font-semibold text-[#66594d]">
                  <input
                    type="checkbox"
                    checked={step.enabled}
                    disabled={!pipelineEnabled && index !== singleStepIndex}
                    onChange={(event) => updateStep(index, { enabled: event.target.checked })}
                    className="h-4 w-4 rounded border-[#ead8c6]"
                  />
                  {!pipelineEnabled && index === singleStepIndex ? '단일 실행' : '사용'}
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Textarea
                  label="System Prompt"
                  value={step.systemPrompt}
                  rows={7}
                  disabled={!pipelineEnabled && index !== singleStepIndex}
                  onChange={(value) => updateStep(index, { systemPrompt: value })}
                />
                <Textarea
                  label="User Prompt Template"
                  value={step.userPromptTemplate}
                  rows={7}
                  disabled={!pipelineEnabled && index !== singleStepIndex}
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
                  disabled={!pipelineEnabled && index !== singleStepIndex}
                  onChange={(value) => updateStep(index, { temperature: value })}
                />
                <NumberInput
                  label="Max Tokens"
                  labelNote="최대 16,000 토큰"
                  value={step.maxTokens}
                  step="100"
                  min="256"
                  max={String(BAZI_PROMPT_MAX_TOKENS_LIMIT)}
                  disabled={!pipelineEnabled && index !== singleStepIndex}
                  onChange={(value) => updateStep(index, { maxTokens: value })}
                />
              </div>
            </section>
          ))}
        </div>

        <section className={`mt-5 rounded-[10px] border border-[#eee2d6] px-4 py-4 transition ${pipelineEnabled ? 'bg-[#fffdf9]' : 'bg-[#f7f3ee] opacity-60'}`}>
          <h4 className="text-[22px] font-semibold text-[#171553]">최종 통합 편집</h4>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Textarea
              label="Finalize System Prompt"
              value={formConfig.finalize.systemPrompt}
              rows={7}
              disabled={!pipelineEnabled}
              onChange={(value) => updateConfig({
                finalize: { ...formConfig.finalize, systemPrompt: value },
              })}
            />
            <Textarea
              label="Finalize User Prompt Template"
              value={formConfig.finalize.userPromptTemplate}
              rows={7}
              disabled={!pipelineEnabled}
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
              disabled={!pipelineEnabled}
              onChange={(value) => updateConfig({
                finalize: { ...formConfig.finalize, temperature: value },
              })}
            />
            <NumberInput
              label="Max Tokens"
              labelNote="최대 16,000 토큰"
              value={formConfig.finalize.maxTokens}
              step="100"
              min="256"
              max={String(BAZI_PROMPT_MAX_TOKENS_LIMIT)}
              disabled={!pipelineEnabled}
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
const textareaClassName = 'w-full rounded-[9px] border border-[#ead8c6] bg-white px-3 py-3 text-[15px] leading-[1.6] text-[#111111] outline-none transition focus:border-[#191450]';

function sortPromptSettings(a: BaziPromptSetting, b: BaziPromptSetting) {
  return a.sortOrder - b.sortOrder || a.key.localeCompare(b.key);
}

function TextInput({
  label,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    </label>
  );
}

function NumberInput({
  label,
  labelNote,
  value,
  min,
  max,
  step,
  disabled = false,
  onChange,
}: {
  label: string;
  labelNote?: string;
  value: number;
  min: string;
  max: string;
  step: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline gap-2 text-[15px] font-semibold text-[#66594d]">
        {label}
        {labelNote && <span className="text-[11px] font-normal text-[#9a8c7f]">{labelNote}</span>}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
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
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">{label}</span>
      <textarea
        value={value}
        rows={rows}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-[9px] border border-[#ead8c6] bg-white px-3 py-3 font-mono text-[15px] leading-7 text-[#111111] outline-none transition focus:border-[#191450]"
      />
    </label>
  );
}
