-- 궁합 등 여러 명의 명식을 사용하는 상담을 지원합니다.
alter table yaho.consultation_types
add column if not exists subject_count smallint not null default 1
check (subject_count between 1 and 4);

create table if not exists yaho.consultation_subjects (
  id uuid primary key default extensions.gen_random_uuid(),
  consultation_id uuid not null references yaho.user_consultations(id) on delete cascade,
  person_id uuid references yaho.people(id) on delete set null,
  position smallint not null check (position between 1 and 4),
  subject_name varchar(100) not null,
  birth_params jsonb not null,
  bazi_result jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (consultation_id, position)
);

create index if not exists consultation_subjects_consultation_position_idx
on yaho.consultation_subjects (consultation_id, position);

alter table yaho.consultation_subjects enable row level security;
grant all on yaho.consultation_subjects to service_role;
