# 명리야호 (myungri-yaho) 프로젝트 생성 및 구현 지침서

이 문서는 기존 `dowon-v2` 프로젝트의 핵심 사주 해석(Bazi) 로직, DeepSeek API 연동 파이프라인, 프롬프트 관리 기능을 별도의 Next.js + Supabase 기반 신규 프로젝트인 **명리야호 (myungri-yaho)**로 마이그레이션 및 신규 구축하기 위한 상세 지침서입니다.

---

## 1. 프로젝트 개요

- **프로젝트명**: 명리야호 (`myungri-yaho`)
- **기술 스택**: Next.js (App Router, v15+), Supabase (Database, `yaho` 스키마), Next Auth (v5 / Auth.js), Tailwind CSS
- **핵심 목표**:
  1. 만세력 결과(`BaziResult`) 데이터를 입력받아 사주 해설을 생성하는 독립 서비스 구축
  2. 다단계 프롬프트 파이프라인(원국 -> 성향 -> 적성 -> 운 흐름 -> 최종 통합) 구현
  3. 실시간 프롬프트 변경이 가능한 Admin UI 및 DB 연동
  4. Next.js `after()` API 등을 이용한 백그라운드 AI 해석 비동기 처리
  5. Supabase의 기본 Auth 대신 Next Auth를 사용해 `yaho.users` 테이블과 독립적인 사용자 인증 처리

---

## 2. Supabase DB 스키마 설계

새 프로젝트에 필요한 데이터베이스 스키마(SQL DDL)입니다. Supabase SQL Editor에 그대로 붙여넣어 실행할 수 있습니다.

```sql
-- 0. yaho 스키마 생성
CREATE SCHEMA IF NOT EXISTS yaho;

-- 1. 회원 및 역할 관리 테이블 (기본 auth.users와 연계되지 않고 독립적으로 Next Auth와 연계)
CREATE TABLE yaho.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Next Auth Credentials Provider 등에서 사용
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'staff', 'user')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) 활성화
ALTER TABLE yaho.users ENABLE ROW LEVEL SECURITY;

-- 2. 프롬프트 파이프라인 및 서비스 설정 테이블
CREATE TABLE yaho.service_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE yaho.service_settings ENABLE ROW LEVEL SECURITY;

-- 3. 회원용 사주 해석 신청 및 결과 테이블 (yaho.users와 연계, 비회원 테이블은 생성하지 않음)
CREATE TABLE yaho.user_consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES yaho.users(id) ON DELETE CASCADE,
    subject_name VARCHAR(100),
    request_date_kst DATE NOT NULL,
    bazi_result JSONB NOT NULL,
    prompt TEXT,
    result_text TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    prompt_version VARCHAR(100),
    generation_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE yaho.user_consultations ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책 설정 예시 (Next Auth를 백엔드에서 사용할 경우 DB 접근 권한 설정을 처리해야 함)
-- API Route 등에서 Supabase Service Role Key를 사용해 RLS를 우회하는 아키텍처를 주로 활용합니다.

-- yaho.users 정책
CREATE POLICY "Allow public read for users" ON yaho.users FOR SELECT USING (true);

-- yaho.service_settings 정책
CREATE POLICY "Allow public read for settings" ON yaho.service_settings FOR SELECT USING (true);

-- yaho.user_consultations 정책
CREATE POLICY "Allow select for user consultations" ON yaho.user_consultations FOR SELECT USING (true);
```
```

---

## 3. 핵심 마이그레이션 로직 및 파일 설계

기존 `dowon-v2` 프로젝트에서 이식해야 할 3대 핵심 파일 설계입니다.

### ① DeepSeek API 기초 설정 (`src/lib/deepseek.ts`)
```typescript
export const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
export const DEEPSEEK_MODEL = 'deepseek-v4-pro';
```

### ② 프롬프트 템플릿 및 파이프라인 구성 (`src/lib/bazi-prompt-config.ts`)
- 원국 분석(`core`), 성향 분석(`personality`), 적성 분석(`career`), 대운/세운 흐름 분석(`flow`) 단계를 병렬 또는 순차로 실행합니다.
- 최종 편집 단계(`finalize`)에서 마크다운 제거, 특정 학파명 필터링, 정중한 한국어 톤앤매너 편집을 수행합니다.
- `bazi_free_consultation_prompt_pipeline` 키로 `service_settings` 테이블에 저장되어 관리됩니다.
- 기존 구현 코드 링크 참고: [bazi-prompt-config.ts](file:///home/ocean3885/projects/dowon-v2/src/lib/bazi-prompt-config.ts)

### ③ 비동기 파이프라인 생성 및 DB 연동 (`src/lib/bazi-consultation.ts`)
- `runBaziGenerationPipeline`: 다단계 API 요청을 관리하며, 중간 텍스트가 너무 길면 DeepSeek를 사용하여 핵심만 요약하는 **Compaction(압축)** 처리를 지원합니다.
- `generateAndStoreBaziInterpretation`: Next.js 15의 `after()` API 내에서 실행되어 백그라운드 스레드에서 DeepSeek API 호출 및 DB 상태를 `pending` -> `completed`/`failed`로 업데이트합니다.
- 기존 구현 코드 링크 참고: [bazi-consultation.ts](file:///home/ocean3885/projects/dowon-v2/src/lib/bazi-consultation.ts)

## 4. 초기 패키지 및 환경 설정

프로젝트 폴더 내에서 필요한 패키지를 설치하고 환경 변수를 구성합니다.

### Step 1: Supabase, Next Auth 및 필수 패키지 설치
```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react next-auth@beta bcryptjs
npm install --save-dev @types/bcryptjs
```

### Step 3: 환경 변수 구성 (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key # 백그라운드 DB 갱신용 (RLS 바이패스 등에 활용)
DEEPSEEK_API_KEY=your-deepseek-api-key
AUTH_SECRET=your-next-auth-secret-key # Next Auth에 사용할 시크릿 키
```

---

## 5. 구현 방향 제어를 위한 AI 프롬프트 지시 템플릿

새 프로젝트가 생성된 폴더 내에서 Cursor, Claude, Antigravity 등의 AI 에이전트를 가동하고 아래 프롬프트를 입력하면 원하는 아키텍처대로 단번에 구현이 가능합니다.

````markdown
# [AI 지시 프롬프트 템플릿] - 그대로 복사해서 새 에이전트에 입력하세요.

명리야호(myungri-yaho) 프로젝트에서 사용할 사주(Bazi) 해석 및 DeepSeek API 프롬프트 파이프라인 로직을 구현해주세요.
이전에 참고용 프로젝트인 `dowon-v2`에서 검증된 핵심 비즈니스 로직을 이식하고, 새로운 Next.js 프로젝트 구조에 맞게 최적화해야 합니다.

### 1. 요구 사항
1. **API 키 설정**: `process.env.DEEPSEEK_API_KEY`를 사용하여 `https://api.deepseek.com/chat/completions`로 POST 요청을 보냅니다. 기본 모델은 `deepseek-v4-pro`입니다.
2. **다단계 프롬프트 파이프라인**: 
   - `core` (원국 분석), `personality` (성향), `career` (적성), `flow` (대운/세운) 단계를 거친 뒤, `finalize` 단계에서 최종 결과물을 합성합니다.
   - 파이프라인 구성(활성화 여부, 프롬프트 문구, 온값, 토큰 크기)은 Supabase DB의 `yaho.service_settings` 테이블 (`key = 'bazi_free_consultation_prompt_pipeline'`)에서 동적으로 로드 및 파싱해야 합니다. (yaho 스키마를 사용하는 것에 유의하세요)
3. **인증 및 DB 스키마 (Next Auth)**:
   - Supabase Auth를 사용하지 않고, Next Auth (v5) 및 Credentials Provider를 활용해 독립적으로 `yaho.users` 테이블과 연동합니다. 비밀번호 검증은 bcryptjs를 사용합니다.
   - 비회원 상담 기능은 없으며, 모든 상담 신청 및 이력은 로그인된 사용자에 한해 `yaho.user_consultations` 테이블에 저장되어야 합니다.
4. **콘텐츠 컴팩션 (Compaction) 로직**: 
   - 각 분석 단계 결과가 너무 길어지면 최종 프롬프트 한계를 넘어설 수 있으므로, 임계값(예: 4800자)을 넘는 초안은 DeepSeek를 한 번 더 호출해 핵심 판단 중심으로 압축하는 요약 파이프라인을 연계해야 합니다.
5. **비동기 백그라운드 처리 (Next.js `after`)**:
   - 사용자가 사주 해석을 요청하면 `/api/bazi/user-consultation` 등에서 DB (`yaho.user_consultations` 테이블)에 `pending` 상태로 인서트한 뒤, Next.js의 `after()` 함수를 활용하여 백그라운드에서 AI 해석 요청을 비동기 수행하고 완료 시 `completed` 또는 `failed` 상태와 결과 텍스트를 업데이트해야 합니다.

### 2. 참고할 파일 경로 (기존 프로젝트 기준)
다음 기존 프로젝트 파일들의 로직을 참고하여 이식하되, 스키마 및 인증 방식을 새로운 아키텍처에 맞춰 적용해야 합니다:
- 프롬프트 파이프라인 설정 및 가공: [bazi-prompt-config.ts](file:///home/ocean3885/projects/dowon-v2/src/lib/bazi-prompt-config.ts)
- 백그라운드 생성 및 DeepSeek 연동: [bazi-consultation.ts](file:///home/ocean3885/projects/dowon-v2/src/lib/bazi-consultation.ts)
- API 엔드포인트 구현: [route.ts](file:///home/ocean3885/projects/dowon-v2/src/app/api/bazi/free-consultation/route.ts) (경로는 `/api/bazi/user-consultation` 로 변경 및 Next Auth 세션 체크 로직 적용)

위 요구 사항을 바탕으로, `src/lib/deepseek.ts`, `src/lib/bazi-prompt-config.ts`, `src/lib/bazi-consultation.ts`, 그리고 `/api/bazi/user-consultation` 라우트 파일을 신규 작성 및 구성해주세요.
````
