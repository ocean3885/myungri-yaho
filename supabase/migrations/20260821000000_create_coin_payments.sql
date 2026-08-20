create table if not exists yaho.coin_products (
  id uuid primary key default extensions.gen_random_uuid(),
  name varchar(100) not null,
  price_krw integer not null check (price_krw > 0),
  coin_amount integer not null check (coin_amount > 0),
  enabled boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists yaho.coin_wallets (
  user_id uuid primary key references yaho.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists yaho.payment_orders (
  id uuid primary key default extensions.gen_random_uuid(),
  payment_id varchar(100) not null unique,
  user_id uuid not null references yaho.users(id) on delete cascade,
  product_id uuid not null references yaho.coin_products(id),
  product_name varchar(100) not null,
  price_krw integer not null check (price_krw > 0),
  coin_amount integer not null check (coin_amount > 0),
  status varchar(30) not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  portone_transaction_id varchar(200),
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists yaho.coin_transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references yaho.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  type varchar(30) not null check (type in ('charge', 'consultation', 'refund', 'admin_adjustment')),
  payment_order_id uuid references yaho.payment_orders(id),
  consultation_id uuid references yaho.user_consultations(id),
  description varchar(200),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists coin_transactions_payment_charge_idx
on yaho.coin_transactions (payment_order_id) where type = 'charge';
create index if not exists coin_transactions_user_created_idx on yaho.coin_transactions (user_id, created_at desc);
create index if not exists payment_orders_user_created_idx on yaho.payment_orders (user_id, created_at desc);

alter table yaho.consultation_types add column if not exists coin_price integer not null default 1 check (coin_price >= 0);
alter table yaho.user_consultations add column if not exists coin_transaction_id uuid references yaho.coin_transactions(id);

create or replace function yaho.credit_paid_order(p_order_id uuid, p_transaction_id text)
returns integer language plpgsql security definer set search_path = yaho, public as $$
declare v_order yaho.payment_orders%rowtype; v_balance integer;
begin
  select * into v_order from yaho.payment_orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status = 'paid' then
    select balance into v_balance from yaho.coin_wallets where user_id = v_order.user_id;
    return coalesce(v_balance, 0);
  end if;
  if v_order.status <> 'pending' then raise exception 'ORDER_NOT_PENDING'; end if;
  insert into yaho.coin_wallets (user_id, balance) values (v_order.user_id, v_order.coin_amount)
  on conflict (user_id) do update set balance = yaho.coin_wallets.balance + excluded.balance, updated_at = now()
  returning balance into v_balance;
  update yaho.payment_orders set status = 'paid', portone_transaction_id = p_transaction_id, paid_at = now(), updated_at = now() where id = p_order_id;
  insert into yaho.coin_transactions (user_id, amount, balance_after, type, payment_order_id, description)
  values (v_order.user_id, v_order.coin_amount, v_balance, 'charge', v_order.id, v_order.product_name || ' 충전');
  return v_balance;
end; $$;

create or replace function yaho.consume_coins(p_user_id uuid, p_amount integer, p_description text)
returns uuid language plpgsql security definer set search_path = yaho, public as $$
declare v_balance integer; v_id uuid;
begin
  if p_amount <= 0 then raise exception 'INVALID_COIN_AMOUNT'; end if;
  insert into yaho.coin_wallets (user_id, balance) values (p_user_id, 0) on conflict do nothing;
  update yaho.coin_wallets set balance = balance - p_amount, updated_at = now()
  where user_id = p_user_id and balance >= p_amount returning balance into v_balance;
  if v_balance is null then raise exception 'INSUFFICIENT_COINS'; end if;
  insert into yaho.coin_transactions (user_id, amount, balance_after, type, description)
  values (p_user_id, -p_amount, v_balance, 'consultation', p_description) returning id into v_id;
  return v_id;
end; $$;

create or replace function yaho.refund_coin_transaction(p_transaction_id uuid, p_description text)
returns void language plpgsql security definer set search_path = yaho, public as $$
declare v_tx yaho.coin_transactions%rowtype; v_balance integer;
begin
  select * into v_tx from yaho.coin_transactions where id = p_transaction_id and type = 'consultation' for update;
  if not found or exists (select 1 from yaho.coin_transactions where description = 'refund:' || p_transaction_id::text) then return; end if;
  update yaho.coin_wallets set balance = balance + abs(v_tx.amount), updated_at = now() where user_id = v_tx.user_id returning balance into v_balance;
  insert into yaho.coin_transactions (user_id, amount, balance_after, type, description)
  values (v_tx.user_id, abs(v_tx.amount), v_balance, 'refund', 'refund:' || p_transaction_id::text || ':' || p_description);
end; $$;

insert into yaho.coin_products (name, price_krw, coin_amount, sort_order)
select '코인 1개', 990, 1, 10 where not exists (select 1 from yaho.coin_products where price_krw = 990 and coin_amount = 1);
insert into yaho.coin_products (name, price_krw, coin_amount, sort_order)
select '코인 20개', 9900, 20, 20 where not exists (select 1 from yaho.coin_products where price_krw = 9900 and coin_amount = 20);

alter table yaho.coin_products enable row level security;
alter table yaho.coin_wallets enable row level security;
alter table yaho.payment_orders enable row level security;
alter table yaho.coin_transactions enable row level security;
grant all on yaho.coin_products, yaho.coin_wallets, yaho.payment_orders, yaho.coin_transactions to service_role;
grant execute on function yaho.credit_paid_order(uuid, text), yaho.consume_coins(uuid, integer, text), yaho.refund_coin_transaction(uuid, text) to service_role;
