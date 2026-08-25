alter table yaho.consultation_types
add column if not exists icon_key varchar(30) not null default 'sparkles';

alter table yaho.consultation_types
drop constraint if exists consultation_types_icon_key_check;

alter table yaho.consultation_types
add constraint consultation_types_icon_key_check
check (icon_key in ('sparkles', 'users', 'heart', 'landmark', 'briefcase', 'leaf', 'compass', 'calendar'));

update yaho.consultation_types
set icon_key = case
  when subject_count > 1 then 'users'
  when name ~ '재물|금전' then 'landmark'
  when name ~ '직장|진로' then 'briefcase'
  when name ~ '궁합|연애|관계' then 'heart'
  when name ~ '고민' then 'leaf'
  else 'sparkles'
end;
