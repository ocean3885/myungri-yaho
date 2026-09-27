'use client';

import { BriefcaseBusiness, CalendarDays, Check, Code2, Compass, Copy, HeartHandshake, Info, Landmark, Leaf, Plus, RotateCcw, Save, Sparkles, Trash2, Users, X } from 'lucide-react';
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
import { CONSULTATION_ICON_OPTIONS, type ConsultationIconKey } from '@/lib/consultation-icons';

type Props = {
  settings: BaziPromptSetting[];
  defaultConfig: BaziPromptPipelineConfig;
};

type SaveStatus = {
  type: 'success' | 'error';
  message: string;
} | null;

type VariableDoc = {
  key: string;
  name: string;
  description: string;
  example: string;
  isJson?: boolean;
};

const PROMPT_VARIABLE_DOCS: Record<string, VariableDoc> = {
  '{{baziJson}}': {
    key: '{{baziJson}}',
    name: '사주 만세력 표준 JSON',
    description: '사주 4주 원국, 일간, 12운성, 오행 분석(과다/결핍/비율), 형충회합, 신살, 대운 3단계, 세운을 모두 포함한 표준 페이로드입니다.',
    isJson: true,
    example: JSON.stringify({
      gender: "남",
      age: 36,
      dayMaster: "戊",
      pillars: {
        year: ["甲", "子"],
        month: ["丙", "寅"],
        day: ["戊", "辰"],
        time: ["壬", "戌"]
      },
      unseong: {
        year: "태",
        month: "장생",
        day: "관대",
        time: "묘"
      },
      fiveElements: {
        dominant: ["木", "火"],
        deficient: ["金"],
        percentages: { 목: 35, 화: 30, 토: 20, 금: 0, 수: 15 },
        summary: "목화 기운이 왕성하고 금 기운이 부족한 명식"
      },
      interactions: ["인진 방합(木)", "진술 충(辰戌沖)"],
      specialStars: {
        year: ["화개살"],
        month: [],
        day: ["괴강살", "백호대살"],
        time: ["화개살", "역마살"]
      },
      daewoon: {
        previous: ["甲", "子", 2016, 2025, 26, 35],
        current: ["癸", "亥", 2026, 2035, 36, 45],
        next: ["壬", "戌", 2036, 2045, 46, 55]
      },
      sewoon: [2026, "丙", "午"]
    }, null, 2)
  },
  '{{baziSummary}}': {
    key: '{{baziSummary}}',
    name: '사주 종합 자연어 요약문',
    description: '원국의 글자, 오행 분포, 형충회합, 주요 신살, 현재 대운/세운을 읽기 쉬운 한국어 문단으로 요약한 텍스트입니다.',
    example: `[성별: 남, 나이: 36세]인 분이 [년주: 갑(甲)자(子) / 월주: 병(丙)인(寅) / 일주: 무(戊)진(辰) / 시주: 임(壬)술(戌)] 명식으로 태어났습니다.
[오행 분포: 목(35%), 화(30%), 토(20%), 수(15%), 금(0%) (과다: 木, 火 / 부족: 金)]
[형충회합: 인진 방합(木), 진술 충(辰戌沖)]
[주요 신살: 년주: 화개살 / 일주: 괴강살, 백호대살 / 시주: 화개살, 역마살]
[현재 운 흐름: 이전 대운 甲子(26~35세, 2016~2025년) / 현재 대운 癸亥(36~45세, 2026~2035년) / 이후 대운 壬戌(46~55세, 2036~2045년) / 현재 세운 2026년 丙午]입니다.
[대운 연도 범위: 이전 2016~2025년 / 현재 2026~2035년 / 이후 2036~2045년]입니다.`
  },
  '{{gender}}': {
    key: '{{gender}}',
    name: '성별',
    description: '사용자 성별',
    example: '남'
  },
  '{{userAge}}': {
    key: '{{userAge}}',
    name: '사용자 나이',
    description: '사용자의 현재 나이 (한국 나이 또는 만 나이)',
    example: '36세'
  },
  '{{yearPillar}}': {
    key: '{{yearPillar}}',
    name: '년주 (연도 기둥)',
    description: '년주 천간과 지지 (한글 및 한자 병기)',
    example: '갑(甲)자(子)'
  },
  '{{monthPillar}}': {
    key: '{{monthPillar}}',
    name: '월주 (월 기둥)',
    description: '월주 천간과 지지 (한글 및 한자 병기)',
    example: '병(丙)인(寅)'
  },
  '{{dayPillar}}': {
    key: '{{dayPillar}}',
    name: '일주 (본인 기둥)',
    description: '일주 천간(일간)과 지지 (한글 및 한자 병기)',
    example: '무(戊)진(辰)'
  },
  '{{timePillar}}': {
    key: '{{timePillar}}',
    name: '시주 (시간 기둥)',
    description: '시주 천간과 지지 (한글 및 한자 병기)',
    example: '임(壬)술(戌)'
  },
  '{{twelveUnseong}}': {
    key: '{{twelveUnseong}}',
    name: '12운성 (포태법)',
    description: '년/월/일/시 네 기둥의 12운성 에너지 레벨',
    example: '년주: 태 / 월주: 장생 / 일주: 관대 / 시주: 묘'
  },
  '{{fiveElementsSummary}}': {
    key: '{{fiveElementsSummary}}',
    name: '오행 비율 요약',
    description: '사주 내 목/화/토/금/수 오행 분포 비율',
    example: '목(35%), 화(30%), 토(20%), 수(15%), 금(0%)'
  },
  '{{dominantElements}}': {
    key: '{{dominantElements}}',
    name: '과다 오행',
    description: '사주 원국에서 가장 왕성하거나 쏠려있는 오행',
    example: '木, 火'
  },
  '{{deficientElements}}': {
    key: '{{deficientElements}}',
    name: '부족/결핍 오행',
    description: '사주 원국에서 없거나 세력이 약한 오행',
    example: '金'
  },
  '{{interactionsList}}': {
    key: '{{interactionsList}}',
    name: '형충회합 목록',
    description: '천간합/충 및 지지 삼합, 방합, 육합, 형, 충, 파, 해 목록',
    example: '인진 방합(木), 진술 충(辰戌沖)'
  },
  '{{climate}}': {
    key: '{{climate}}',
    name: '조후 상태',
    description: '원국의 계절적 온도/습도 균형 상태',
    example: '조열(燥熱)'
  },
  '{{specialStars}}': {
    key: '{{specialStars}}',
    name: '주요 신살',
    description: '기둥별 배치된 길신 및 흉신 목록',
    example: '년주: 화개살 / 일주: 괴강살, 백호대살 / 시주: 화개살, 역마살'
  },
  '{{currentYear}}': {
    key: '{{currentYear}}',
    name: '현재 연도',
    description: 'KST 기준 현재 연도 (4자리 숫자)',
    example: '2026'
  },
  '{{currentSewoon}}': {
    key: '{{currentSewoon}}',
    name: '현재 세운 간지',
    description: '현재 연도의 간지 글자',
    example: '丙午'
  },
  '{{previousDaewoon}}': {
    key: '{{previousDaewoon}}',
    name: '이전 대운',
    description: '직전 10년간 지나온 대운 간지 및 나이/연도',
    example: '甲子(26~35세, 2016~2025년)'
  },
  '{{previousDaewoonYearRange}}': {
    key: '{{previousDaewoonYearRange}}',
    name: '이전 대운 연도 범위',
    description: '이전 대운 기간',
    example: '2016~2025년'
  },
  '{{currentDaewoon}}': {
    key: '{{currentDaewoon}}',
    name: '현재 대운',
    description: '현재 머물고 있는 10년 대운 간지 및 나이/연도',
    example: '癸亥(36~45세, 2026~2035년)'
  },
  '{{currentDaewoonYearRange}}': {
    key: '{{currentDaewoonYearRange}}',
    name: '현재 대운 연도 범위',
    description: '현재 대운 기간',
    example: '2026~2035년'
  },
  '{{nextDaewoon}}': {
    key: '{{nextDaewoon}}',
    name: '다음 대운',
    description: '앞으로 다가올 10년 대운 간지 및 나이/연도',
    example: '壬戌(46~55세, 2036~2045년)'
  },
  '{{nextDaewoonYearRange}}': {
    key: '{{nextDaewoonYearRange}}',
    name: '다음 대운 연도 범위',
    description: '다음 대운 기간',
    example: '2036~2045년'
  },
  '{{subjectCount}}': {
    key: '{{subjectCount}}',
    name: '상담 인원 수',
    description: '상담에 참여하는 총 인물 수',
    example: '2'
  },
  '{{subjectsJson}}': {
    key: '{{subjectsJson}}',
    name: '다중 인물 사주 JSON',
    description: '궁합/가족 상담 시 대상자 전원의 사주 원국 정보가 포함된 배열 JSON',
    isJson: true,
    example: JSON.stringify([
      {
        name: "김철수",
        bazi: {
          gender: "남",
          age: 36,
          pillars: {
            year: ["甲", "子"],
            month: ["丙", "寅"],
            day: ["戊", "辰"],
            time: ["壬", "戌"]
          }
        }
      },
      {
        name: "이영희",
        bazi: {
          gender: "여",
          age: 33,
          pillars: {
            year: ["丁", "卯"],
            month: ["癸", "丑"],
            day: ["癸", "酉"],
            time: ["丙", "辰"]
          }
        }
      }
    ], null, 2)
  },
  '{{subjectsSummary}}': {
    key: '{{subjectsSummary}}',
    name: '다중 인물 명식 요약문',
    description: '각 인물의 명식 요약을 묶어둔 텍스트',
    example: `[인물 1: 김철수]
[성별: 남, 나이: 36세]인 분이 [년주: 갑(甲)자(子) / 월주: 병(丙)인(寅) / 일주: 무(戊)진(辰) / 시주: 임(壬)술(戌)] 명식으로 태어났습니다.

[인물 2: 이영희]
[성별: 여, 나이: 33세]인 분이 [년주: 정(丁)묘(卯) / 월주: 계(癸)축(丑) / 일주: 계(癸)유(酉) / 시주: 병(丙)진(辰)] 명식으로 태어났습니다.`
  },
  '{{person1Name}}': {
    key: '{{person1Name}}',
    name: '1번 인물 이름',
    description: '첫 번째 대상자 이름',
    example: '김철수'
  },
  '{{person1BaziJson}}': {
    key: '{{person1BaziJson}}',
    name: '1번 인물 baziJson',
    description: '첫 번째 대상자의 baziJson 문자열',
    example: '{"gender":"남","age":36,"pillars":{...}}'
  },
  '{{person1BaziSummary}}': {
    key: '{{person1BaziSummary}}',
    name: '1번 인물 요약문',
    description: '첫 번째 대상자의 명식 요약 텍스트',
    example: '[성별: 남, 나이: 36세]인 분이 [년주: 갑(甲)자(子) / 월주: 병(丙)인(寅)...] 태어났습니다.'
  },
  '{{person2Name}}': {
    key: '{{person2Name}}',
    name: '2번 인물 이름',
    description: '두 번째 대상자 이름',
    example: '이영희'
  },
  '{{person2BaziJson}}': {
    key: '{{person2BaziJson}}',
    name: '2번 인물 baziJson',
    description: '두 번째 대상자의 baziJson 문자열',
    example: '{"gender":"여","age":33,"pillars":{...}}'
  },
  '{{person2BaziSummary}}': {
    key: '{{person2BaziSummary}}',
    name: '2번 인물 요약문',
    description: '두 번째 대상자의 명식 요약 텍스트',
    example: '[성별: 여, 나이: 33세]인 분이 [년주: 정(丁)묘(卯) / 월주: 계(癸)축(丑)...] 태어났습니다.'
  },
  '{{previousStepResults}}': {
    key: '{{previousStepResults}}',
    name: '이전 단계 누적 분석 초안',
    description: '순차 실행 모드에서 직전 단계들까지 생성된 분석 내용',
    example: `[원국 구조 분석]
일간 무토는 인월에 태어나 실령하였으나...`
  },
  '{{stepResults}}': {
    key: '{{stepResults}}',
    name: '전체 분석 초안 묶음',
    description: '최종 편집(finalize) 단계에 전달되는 앞선 모든 분석 단계의 초안',
    example: `[원국 구조 분석]
일간 무토(戊土)는 월지 인목 편관을 보아...

[성향 및 관계 분석]
책임감이 강하고 묵직한 추진력을 가지며...

[적성 및 일의 방식 분석]
체계적인 기획이나 조직 관리 분야에서 강점을...`
  },
};

const promptVariableGroups = [
  {
    label: '기본 명식 / 요약',
    variables: ['{{baziJson}}', '{{baziSummary}}', '{{gender}}', '{{userAge}}'],
  },
  {
    label: '사주 기둥 (원국)',
    variables: ['{{yearPillar}}', '{{monthPillar}}', '{{dayPillar}}', '{{timePillar}}', '{{twelveUnseong}}'],
  },
  {
    label: '오행 / 신살 / 형충',
    variables: [
      '{{fiveElementsSummary}}',
      '{{dominantElements}}',
      '{{deficientElements}}',
      '{{interactionsList}}',
      '{{climate}}',
      '{{specialStars}}',
    ],
  },
  {
    label: '대운 / 세운',
    variables: [
      '{{currentYear}}',
      '{{currentSewoon}}',
      '{{previousDaewoon}}',
      '{{previousDaewoonYearRange}}',
      '{{currentDaewoon}}',
      '{{currentDaewoonYearRange}}',
      '{{nextDaewoon}}',
      '{{nextDaewoonYearRange}}',
    ],
  },
  {
    label: '다중 인물 (궁합 등)',
    variables: [
      '{{subjectCount}}',
      '{{subjectsJson}}',
      '{{subjectsSummary}}',
      '{{person1Name}}',
      '{{person1BaziJson}}',
      '{{person1BaziSummary}}',
      '{{person2Name}}',
      '{{person2BaziJson}}',
      '{{person2BaziSummary}}',
    ],
  },
  {
    label: '파이프라인 단계',
    variables: ['{{previousStepResults}}', '{{stepResults}}'],
  },
];

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
  const [newConsultationImageUrl, setNewConsultationImageUrl] = useState('/images/consultations/saju.webp');
  const [newConsultationIconKey, setNewConsultationIconKey] = useState<ConsultationIconKey>('sparkles');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>(null);
  const [activeVariableKey, setActiveVariableKey] = useState<string | null>('{{baziJson}}');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
          imageUrl: newConsultationImageUrl,
          iconKey: newConsultationIconKey,
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
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : null,
        iconKey: data.iconKey || newConsultationIconKey,
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
      setNewConsultationImageUrl('/images/consultations/saju.webp');
      setNewConsultationIconKey('sparkles');
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
          imageUrl: selectedSetting.imageUrl,
          iconKey: selectedSetting.iconKey,
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
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : null,
        iconKey: data.iconKey || selectedSetting.iconKey,
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
          imageUrl: selectedSetting.imageUrl,
          iconKey: selectedSetting.iconKey,
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
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : null,
        iconKey: data.iconKey || selectedSetting.iconKey,
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
            <span className="mb-2 block text-[15px] font-semibold text-[#66594d]">대표 이미지</span>
            <input
              value={newConsultationImageUrl}
              onChange={(event) => setNewConsultationImageUrl(event.target.value)}
              placeholder="public/images/consultations/saju.webp"
              className={inputClassName}
            />
            <span className="mt-1 block text-[12px] text-[#8a7a68]">public 경로 또는 /images/... 형식</span>
          </label>
          <IconPicker
            className="mt-3"
            value={newConsultationIconKey}
            onChange={setNewConsultationIconKey}
          />
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
            <div className="mt-4 max-w-5xl rounded-[10px] border border-[#eadfd4] bg-[#fffaf4] px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-[#b06b16]" strokeWidth={2} />
                  <p className="text-[13px] font-semibold text-[#66594d]">사용 가능 변수 <span className="text-[11px] font-normal text-[#8a7a68]">(변수를 클릭하면 상세 설명 및 실제 주입되는 값 예시를 확인할 수 있습니다)</span></p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {promptVariableGroups.map((group) => (
                  <div key={group.label}>
                    <p className="text-[12px] font-semibold text-[#b06b16]">{group.label}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {group.variables.map((variable) => {
                        const isSelected = activeVariableKey === variable;
                        return (
                          <button
                            key={variable}
                            type="button"
                            onClick={() => setActiveVariableKey((prev) => prev === variable ? null : variable)}
                            className={`cursor-pointer rounded-[6px] border px-2 py-1 text-[12px] font-semibold transition ${
                              isSelected
                                ? 'border-[#191450] bg-[#191450] text-white shadow-sm'
                                : 'border-[#ead8c6] bg-white text-[#2a2018] hover:border-[#b06b16] hover:bg-[#fff5ea]'
                            }`}
                          >
                            {variable}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {activeVariableKey && PROMPT_VARIABLE_DOCS[activeVariableKey] && (
                <div className="mt-4 overflow-hidden rounded-[8px] border border-[#ebd8c4] bg-[#fffcf8] p-3.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-[#ebd8c4] pb-2">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-[#191450]" strokeWidth={2} />
                      <span className="font-mono text-[13px] font-bold text-[#191450]">{activeVariableKey}</span>
                      <span className="text-[12px] font-semibold text-[#8a6a42]">({PROMPT_VARIABLE_DOCS[activeVariableKey].name})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(activeVariableKey);
                          setCopiedKey(activeVariableKey);
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                        className="flex items-center gap-1 rounded-[5px] border border-[#ead8c6] bg-white px-2 py-1 text-[11px] font-semibold text-[#66594d] transition hover:bg-[#f7f0e8]"
                      >
                        {copiedKey === activeVariableKey ? (
                          <>
                            <Check className="h-3 w-3 text-[#357247]" strokeWidth={2.5} />
                            <span className="text-[#357247]">복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" strokeWidth={2} />
                            <span>변수 복사</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveVariableKey(null)}
                        className="rounded-[5px] p-1 text-[#8a7a68] hover:bg-[#f0e7dc] hover:text-[#2a2018]"
                        title="닫기"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-[12.5px] leading-[1.5] text-[#5c4f42]">
                    {PROMPT_VARIABLE_DOCS[activeVariableKey].description}
                  </p>

                  <div className="mt-2.5">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[#8a7a68]">
                      <span>실제 주입 값 예시 (Sample Value):</span>
                      {PROMPT_VARIABLE_DOCS[activeVariableKey].isJson && (
                        <span className="rounded bg-[#ebe3d7] px-1.5 py-0.5 font-mono text-[10px] text-[#554a3e]">JSON</span>
                      )}
                    </div>
                    <pre className="max-h-60 overflow-auto rounded-[6px] border border-[#e2d2c1] bg-[#1e1e24] p-2.5 font-mono text-[11.5px] leading-relaxed text-[#f4efe8]">
                      <code>{PROMPT_VARIABLE_DOCS[activeVariableKey].example}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 xl:w-[120px] xl:grid-cols-1">
            <button
              type="button"
              onClick={() => saveConfig('reset')}
              disabled={isSaving || !selectedSetting}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-[#ead8c6] bg-white px-3 text-[14px] font-semibold text-[#66594d] transition hover:bg-[#fff8f0] disabled:cursor-wait disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
              기본값
            </button>
            <button
              type="button"
              onClick={() => saveConfig('save')}
              disabled={isSaving || !selectedSetting}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] bg-[#191450] px-3 text-[14px] font-semibold text-white transition hover:bg-[#24206a] disabled:cursor-wait disabled:bg-[#cfc8bd]"
            >
              <Save className="h-4 w-4" strokeWidth={2} />
              {isSaving ? '저장 중' : '저장'}
            </button>
            <button
              type="button"
              onClick={deleteSetting}
              disabled={isSaving || !selectedSetting}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-[#f0c7ba] bg-[#fff2ec] px-3 text-[14px] font-semibold text-[#a05738] transition hover:bg-[#ffe8de] disabled:cursor-wait disabled:opacity-60"
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
              <TextInput
                label="대표 이미지"
                value={selectedSetting.imageUrl || ''}
                onChange={(value) => updateSelectedSetting({ imageUrl: value })}
              />
              <p className="mt-1 text-[12px] text-[#8a7a68]">예: public/images/consultations/saju.webp</p>
            </div>
            <IconPicker
              className="mt-4"
              value={selectedSetting.iconKey}
              onChange={(value) => updateSelectedSetting({ iconKey: value })}
            />
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

const consultationIconComponents = {
  sparkles: Sparkles,
  users: Users,
  heart: HeartHandshake,
  landmark: Landmark,
  briefcase: BriefcaseBusiness,
  leaf: Leaf,
  compass: Compass,
  calendar: CalendarDays,
} satisfies Record<ConsultationIconKey, typeof Sparkles>;

function IconPicker({
  value,
  onChange,
  className = '',
}: {
  value: ConsultationIconKey;
  onChange: (value: ConsultationIconKey) => void;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="mb-2 text-[15px] font-semibold text-[#66594d]">메인 아이콘</legend>
      <div className="grid grid-cols-4 gap-2">
        {CONSULTATION_ICON_OPTIONS.map((option) => {
          const Icon = consultationIconComponents[option.key];
          const selected = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              aria-pressed={selected}
              title={`${option.label} 아이콘`}
              className={`flex h-16 flex-col items-center justify-center gap-1 rounded-[8px] border text-[11px] font-semibold transition ${selected ? 'border-[#191450] bg-[#f4f1ff] text-[#191450]' : 'border-[#ead8c6] bg-white text-[#76695d] hover:bg-[#fff8f0]'}`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
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
