insert into yaho.service_settings (key, value)
select 'prompt.bazi.free_basic', value
from yaho.service_settings
where key = 'bazi_free_consultation_prompt_pipeline'
on conflict (key) do nothing;
