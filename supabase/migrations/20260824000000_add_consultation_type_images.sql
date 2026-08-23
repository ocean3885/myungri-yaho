alter table yaho.consultation_types
add column if not exists image_url text;

update yaho.consultation_types
set image_url = '/images/consultations/saju.webp'
where key = 'free_basic' and image_url is null;
