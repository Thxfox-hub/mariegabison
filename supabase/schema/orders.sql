-- Orders table for Marie Gabison Paris
-- Run this in the Supabase SQL Editor to create the orders table.
--
-- The webhook at /api/webhooks/stripe inserts rows here when a Checkout
-- Session completes.

create table if not exists public.orders (
  id uuid not null default gen_random_uuid() primary key,
  stripe_session_id text unique not null,
  stripe_payment_intent_id text,
  customer_email text,
  customer_name text,
  customer_phone text,
  shipping_street text,
  shipping_postal_code text,
  shipping_city text,
  shipping_country text,
  amount_total integer,          -- in cents (Stripe convention)
  currency text default 'eur',
  payment_status text default 'unpaid',
  status text default 'created', -- created | paid | canceled | failed | shipped | delivered
  items jsonb,                   -- array of { name, quantity, amount }
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz
);

create index if not exists idx_orders_stripe_session on public.orders (stripe_session_id);
create index if not exists idx_orders_customer_email on public.orders (customer_email);
create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created_at on public.orders (created_at desc);

-- Row Level Security
alter table public.orders enable row level security;

-- The service role (used by the webhook) bypasses RLS, so no policy is needed
-- for inserts from the webhook. These policies allow authenticated users to
-- read their own orders.

create policy if not exists "users can read own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "users can update own orders"
  on public.orders for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
