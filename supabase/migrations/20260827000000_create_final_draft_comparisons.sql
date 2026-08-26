create table if not exists yaho.final_draft_comparisons (
  id uuid primary key default extensions.gen_random_uuid(),
  batch_id uuid not null,
  created_by uuid not null references yaho.users(id) on delete cascade,
  draft text not null,
  system_prompt text not null,
  user_prompt text not null,
  provider varchar(20) not null,
  model varchar(100) not null,
  result_text text,
  status varchar(20) not null default 'completed',
  error_message text,
  duration_ms integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint final_draft_comparisons_provider_check check (provider in ('deepseek', 'openai', 'gemini')),
  constraint final_draft_comparisons_status_check check (status in ('completed', 'failed'))
);

create index if not exists final_draft_comparisons_created_at_idx
on yaho.final_draft_comparisons (created_at desc);

create index if not exists final_draft_comparisons_batch_id_idx
on yaho.final_draft_comparisons (batch_id);

alter table yaho.final_draft_comparisons enable row level security;

grant all on yaho.final_draft_comparisons to service_role;
