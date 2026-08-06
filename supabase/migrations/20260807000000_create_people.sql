create table if not exists yaho.people (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references yaho.users(id) on delete cascade,
  name varchar(100) not null,
  relation varchar(50) not null,
  gender varchar(20) not null,
  calendar varchar(20) not null,
  birth_date varchar(10) not null,
  birth_time varchar(20),
  birth_params jsonb not null,
  bazi_result jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint people_gender_check check (gender in ('남성', '여성')),
  constraint people_calendar_check check (calendar in ('양력', '음력')),
  constraint people_relation_check check (relation in ('나', '배우자', '가족', '친구', '기타'))
);

create index if not exists people_user_created_at_idx on yaho.people (user_id, created_at desc);
create index if not exists people_user_name_idx on yaho.people (user_id, name);

drop trigger if exists set_people_updated_at on yaho.people;
create trigger set_people_updated_at
before update on yaho.people
for each row execute function yaho.set_updated_at();

alter table yaho.people enable row level security;

grant all on yaho.people to service_role;
