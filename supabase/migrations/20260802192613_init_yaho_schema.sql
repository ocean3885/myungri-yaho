create schema if not exists yaho;

create extension if not exists pgcrypto with schema extensions;

create or replace function yaho.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists yaho.users (
  id uuid primary key default extensions.gen_random_uuid(),
  email varchar(255) not null unique,
  password_hash varchar(255),
  name varchar(100),
  role varchar(50) not null default 'user',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint users_role_check check (role in ('admin', 'staff', 'user'))
);

create table if not exists yaho.service_settings (
  key varchar(100) primary key,
  value jsonb not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists yaho.user_consultations (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references yaho.users(id) on delete cascade,
  subject_name varchar(100),
  request_date_kst date not null,
  bazi_result jsonb not null,
  prompt text,
  result_text text,
  status varchar(50) not null default 'pending',
  completed_at timestamptz,
  error_message text,
  prompt_version varchar(100),
  generation_metadata jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint user_consultations_status_check check (status in ('pending', 'completed', 'failed'))
);

create index if not exists users_email_idx on yaho.users (email);
create index if not exists user_consultations_user_created_at_idx on yaho.user_consultations (user_id, created_at desc);
create index if not exists user_consultations_user_request_date_idx on yaho.user_consultations (user_id, request_date_kst);
create index if not exists user_consultations_status_idx on yaho.user_consultations (status);

drop trigger if exists set_users_updated_at on yaho.users;
create trigger set_users_updated_at
before update on yaho.users
for each row execute function yaho.set_updated_at();

drop trigger if exists set_service_settings_updated_at on yaho.service_settings;
create trigger set_service_settings_updated_at
before update on yaho.service_settings
for each row execute function yaho.set_updated_at();

alter table yaho.users enable row level security;
alter table yaho.service_settings enable row level security;
alter table yaho.user_consultations enable row level security;

grant usage on schema yaho to anon, authenticated, service_role;
grant all on all tables in schema yaho to service_role;
grant all on all functions in schema yaho to service_role;
grant all on all sequences in schema yaho to service_role;

alter default privileges in schema yaho grant all on tables to service_role;
alter default privileges in schema yaho grant all on functions to service_role;
alter default privileges in schema yaho grant all on sequences to service_role;

insert into yaho.service_settings (key, value)
values (
  'bazi_free_consultation_prompt_pipeline',
  $json$
  {
    "enabled": true,
    "version": "free-bazi-rich-v1",
    "model": "deepseek-v4-pro",
    "executionMode": "parallel",
    "steps": [
      {
        "key": "core",
        "label": "원국 구조 분석",
        "enabled": true,
        "systemPrompt": "당신은 한국어로 사주 원국의 구조, 월령, 일간의 힘, 오행 흐름을 정밀하게 해석하는 명리학 상담사입니다. 운명 단정, 공포 조장, 건강/투자/법률 확정 조언은 피합니다.",
        "userPromptTemplate": "{{baziSummary}}\n\n위 명식의 원국 구조를 깊이 있게 분석해 주세요.\n일간의 상태, 월령의 작용, 오행의 흐름, 사주 네 기둥의 상호작용을 중심으로 설명합니다.\n합, 충, 형, 파, 해, 묘고 등 글자 관계가 의미를 만드는 경우 그 이유를 구체적으로 짚어주세요.\n마크다운 기호는 쓰지 말고, 정중한 한국어 경어체로 작성해 주세요.",
        "temperature": 0.45,
        "maxTokens": 1800
      },
      {
        "key": "personality",
        "label": "성향 및 관계 분석",
        "enabled": true,
        "systemPrompt": "당신은 사주 원국을 바탕으로 성향, 사고방식, 감정 표현, 대인관계 패턴을 현실적으로 설명하는 한국어 상담사입니다.",
        "userPromptTemplate": "{{baziSummary}}\n\n위 명식에서 드러나는 성향, 사고방식, 대인관계 흐름을 분석해 주세요.\n장점과 보완점을 균형 있게 설명하고, 단정적 성격 규정은 피합니다.\n왜 그렇게 볼 수 있는지 원국의 글자와 오행 작용을 근거로 설명해 주세요.",
        "temperature": 0.55,
        "maxTokens": 1800
      },
      {
        "key": "career",
        "label": "적성 및 일의 방식 분석",
        "enabled": true,
        "systemPrompt": "당신은 사주 원국의 십신, 오행, 궁위 흐름을 바탕으로 적성, 일 처리 방식, 사회적 역할을 분석하는 한국어 명리 상담사입니다.",
        "userPromptTemplate": "{{baziSummary}}\n\n위 명식의 적성, 일 처리 방식, 직업적 강점과 보완점을 분석해 주세요.\n특정 직업을 단정하기보다 어떤 환경, 역할, 일의 방식에서 강점이 드러나기 쉬운지 설명합니다.\n일간, 월지, 식상/재성/관성/인성의 작용이 보이면 그 흐름을 풀어주세요.",
        "temperature": 0.55,
        "maxTokens": 1800
      },
      {
        "key": "flow",
        "label": "대운 및 세운 흐름 분석",
        "enabled": true,
        "systemPrompt": "당신은 사주 원국과 현재 대운, 세운의 관계를 조심스럽고 현실적인 언어로 해석하는 한국어 상담사입니다.",
        "userPromptTemplate": "{{baziSummary}}\n\n현재 운 흐름을 원국과 연결해 분석해 주세요.\n현재 대운: {{currentDaewoon}}\n현재 세운: {{currentYear}}년 {{currentSewoon}}\n대운과 세운이 원국에 주는 자극, 보완, 긴장, 전환 가능성을 구조 중심으로 설명합니다.\n사건을 확정적으로 예언하지 말고 흐름과 주의점 중심으로 작성해 주세요.",
        "temperature": 0.5,
        "maxTokens": 1600
      }
    ],
    "finalize": {
      "systemPrompt": "당신은 여러 사주 분석 초안을 하나의 자연스럽고 깊이 있는 최종 상담문으로 편집하는 전문 한국어 편집자입니다.",
      "userPromptTemplate": "{{baziSummary}}\n\n[분석 초안]\n{{stepResults}}\n\n위 분석 초안을 바탕으로 하나의 완성된 무료 사주 원국 해설문을 작성해 주세요.\n요구사항:\n1. 분석 내용의 깊이와 근거는 유지하되 중복은 제거합니다.\n2. 문단 흐름은 [1. 원국의 핵심 구조], [2. 성향과 관계], [3. 적성과 일의 방식], [4. 현재 운 흐름], [5. 보완점과 조언] 형태로 정리합니다.\n3. 맹파, 맹파명리, 맹파명리학 같은 특정 학파명은 최종문에 쓰지 말고 명리학 또는 명리로 자연스럽게 바꿉니다.\n4. 마크다운 기호(###, **, *, -, _)는 쓰지 않습니다.\n5. 운명 단정, 공포 조장, 건강/투자/법률 확정 조언은 피합니다.\n6. 마지막에 AI 상담은 부정확할 수 있으므로 보다 정확한 상담은 유료상담 서비스를 이용하시라는 취지의 문장을 자연스럽게 추가합니다.",
      "temperature": 0.35,
      "maxTokens": 5000
    }
  }
  $json$::jsonb
)
on conflict (key) do nothing;
