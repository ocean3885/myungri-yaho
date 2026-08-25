alter table yaho.consultation_payment_orders
add column if not exists consented_at timestamptz,
add column if not exists consent_version varchar(50);
