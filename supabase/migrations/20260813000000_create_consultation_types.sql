create table if not exists yaho.consultation_types (
  id uuid primary key default extensions.gen_random_uuid(),
  key varchar(50) not null unique,
  name varchar(100) not null,
  description text,
  prompt_setting_key varchar(100) not null,
  enabled boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint consultation_types_key_check check (key ~ '^[a-z0-9][a-z0-9_-]{0,49}$')
);

create index if not exists consultation_types_enabled_sort_idx on yaho.consultation_types (enabled, sort_order, key);
create index if not exists consultation_types_prompt_setting_key_idx on yaho.consultation_types (prompt_setting_key);

drop trigger if exists set_consultation_types_updated_at on yaho.consultation_types;
create trigger set_consultation_types_updated_at
before update on yaho.consultation_types
for each row execute function yaho.set_updated_at();

alter table yaho.consultation_types enable row level security;

grant all on yaho.consultation_types to service_role;

alter table yaho.user_consultations
add column if not exists consultation_type_key varchar(50),
add column if not exists prompt_setting_key varchar(100);

create index if not exists user_consultations_user_type_created_at_idx
on yaho.user_consultations (user_id, consultation_type_key, created_at desc);

insert into yaho.consultation_types (key, name, description, prompt_setting_key, enabled, sort_order)
values (
  'free_basic',
  '기본 상담',
  '사주 원국을 바탕으로 기본 성향과 현재 운 흐름을 해석합니다.',
  'prompt.bazi.free_basic',
  true,
  10
)
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  prompt_setting_key = excluded.prompt_setting_key,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order;

update yaho.user_consultations
set
  consultation_type_key = coalesce(consultation_type_key, 'free_basic'),
  prompt_setting_key = coalesce(prompt_setting_key, 'prompt.bazi.free_basic')
where consultation_type_key is null or prompt_setting_key is null;
