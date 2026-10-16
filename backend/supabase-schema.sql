-- ============================================================
-- RocAudio Suite — cloud sync schema (Supabase free tier)
-- Run once: Supabase Dashboard → SQL Editor → paste → Run.
-- Then copy Project URL + anon key into js/config.js → backend.
-- Ids are TEXT (client-generated), so offline-first devices can
-- write without collisions. updated_at drives the 6s poll sync.
-- ============================================================

create table if not exists profiles (
  id text primary key,
  role text not null default 'client',
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bookings (
  id text primary key,
  client_id text,
  service_id text,
  service_name text,
  package_name text,
  bonuses jsonb default '[]',
  booking_date text,
  booking_time text,
  notes text,
  pay_option text default 'full',
  numeric_dummy int,           -- placeholder removed below if exists
  total numeric(12,2),
  status text default 'awaiting_payment',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table bookings drop column if exists numeric_dummy;

create table if not exists payments (
  id text primary key,
  client_id text,
  booking_id text,
  ref text,
  amount numeric(12,2),
  method text,
  status text default 'pending',
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoices (
  id text primary key,
  client_id text,
  booking_id text,
  number text,
  lines jsonb default '[]',
  subtotal numeric(12,2),
  vat numeric(12,2),
  total numeric(12,2),
  paid numeric(12,2) default 0,
  status text default 'pending',
  sent_to jsonb default '[]',
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists messages (
  id text primary key,
  client_id text,
  sender text,                 -- me | studio | assistant
  body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists reviews (
  id text primary key,
  client_id text,
  service_id text,
  author_name text,
  rating int,
  body text,
  reply_text text,
  reply_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists notifications (
  id text primary key,
  client_id text,
  title text,
  body text,
  read boolean default false,
  route text default '#/bookings',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Quick-start policies (anon read/write so the PWA syncs without
-- server code). PRODUCTION HARDENING: replace with auth.uid()
-- policies + a studio role once you add Supabase Auth logins.
alter table profiles enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table invoices enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','bookings','payments','invoices','messages','reviews','notifications'] loop
    execute format('drop policy if exists sync_all on %I', t);
    execute format('create policy sync_all on %I for all using (true) with check (true)', t);
  end loop;
end $$;
