-- 코인 선충전 대신 상담 상품을 건별로 결제합니다.
-- 기존 코인 관련 테이블은 과거 거래 기록 보존을 위해 유지합니다.
alter table yaho.consultation_types
add column if not exists price_krw integer not null default 990 check (price_krw >= 0);

update yaho.consultation_types
set price_krw = greatest(coin_price, 0) * 990
where price_krw = 990 and coin_price <> 1;

create table if not exists yaho.consultation_payment_orders (
  id uuid primary key default extensions.gen_random_uuid(),
  payment_id varchar(100) not null unique,
  user_id uuid not null references yaho.users(id) on delete cascade,
  consultation_type_key varchar(50) not null references yaho.consultation_types(key),
  product_name varchar(100) not null,
  price_krw integer not null check (price_krw > 0),
  status varchar(30) not null default 'pending'
    check (status in ('pending', 'paid', 'used', 'cancelled', 'refund_pending', 'refunded', 'refund_failed')),
  portone_transaction_id varchar(200),
  paid_at timestamptz,
  used_at timestamptz,
  refunded_at timestamptz,
  refund_error text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table yaho.user_consultations
add column if not exists payment_order_id uuid references yaho.consultation_payment_orders(id);

create unique index if not exists user_consultations_payment_order_idx
on yaho.user_consultations (payment_order_id)
where payment_order_id is not null;

create index if not exists consultation_payment_orders_user_created_idx
on yaho.consultation_payment_orders (user_id, created_at desc);

alter table yaho.consultation_payment_orders enable row level security;
grant all on yaho.consultation_payment_orders to service_role;
