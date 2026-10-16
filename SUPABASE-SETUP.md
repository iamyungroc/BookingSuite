# SUPABASE CLOUD SYNC — COMPREHENSIVE STEP-BY-STEP ($0)

Makes RocAudio Suite one live system across every phone & computer in the world:
chats, bookings, payments, invoices, reviews, notifications.

---

## STEP 1 — Create the account (2 min)
1. Go to **https://supabase.com** → **Start your project**.
2. Sign up with an email (your `iamyungroc@yahoo.com` is fine) or "Continue with GitHub".
3. Confirm the email if asked.

## STEP 2 — Create the project (2 min + ~1 min provisioning)
1. Dashboard → **New project**.
2. Fill:
   - **Name:** `rocaudio-suite`
   - **Database password:** generate something strong → **save it somewhere private**
     (you will NOT need it for the app; it's the master DB password)
   - **Region:** pick the closest to your clients — for Lagos, choose
     **Europe (West)** e.g. `West EU (Ireland)` or `London`
   - **Pricing plan:** **Free**
3. Click **Create new project** → wait until the status shows *Active / Healthy*
   (usually 1–2 minutes; a progress screen shows meanwhile).

## STEP 3 — Create the tables (1 min)
1. Left sidebar → **SQL Editor** → **New query**.
2. Delete any placeholder text, paste the ENTIRE SQL below, then press **Run**.
3. Expected result: `Success. No rows returned.`
4. Verify: left sidebar → **Table Editor** — you should see 7 tables:
   `profiles, bookings, payments, invoices, messages, reviews, notifications`.

```sql
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
  total numeric(12,2),
  status text default 'awaiting_payment',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
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
  sender text,
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
```

## STEP 4 — Copy the two values I need (1 min)
1. Left sidebar → **Project Settings** (gear icon) → **API**.
2. Copy exactly these two:
   - **Project URL** — looks like `https://abcdefghijklmnop.supabase.co`
   - **anon public** key — a long string starting `eyJhbGciOi...`
3. **Paste BOTH to me in our chat.**
   ⚠️ The **anon** key is *designed* to be public (it's what browsers use).
   🚫 NEVER share/paste the **service_role** key — that one is god-mode. I will never ask for it.

## STEP 5 — What I do the moment you paste them (I will not stop until done)
1. Bake both into `js/config.js → backend { url, key }`.
2. Run my live verification rig against YOUR project: table existence,
   push probe row → pull it back → delete probe (your DB ends clean).
3. Run the full local suite (76 + 16 assertions) with sync enabled.
4. Rebuild previews + produce **zip 1.5.2**.
5. Hand it over with the exact upload steps; then verify your live URL syncs
   (I fetch your deployed config to confirm the keys landed).

## STEP 6 — Your final upload + world-wide test (5 min)
1. Upload the 1.5.2 zip contents to the repo **root** (replace `js/config.js` at minimum),
   commit. Phone: pull-to-refresh twice / reinstall PWA.
2. Test with two devices:
   - Device A (client): create account → chat "Hello from Lagos".
   - Device B (you): Console → Chats → the message appears within ~6 seconds → reply →
     Device A gets it + a tappable notification.
   - Book on A → appears in your Queue on B. Deliver on B → A sees status + invoice update.

---

## Troubleshooting
- **SQL run says "policy already exists"** → fine, the script drops & recreates policies.
- **App still works but no sync** → check `config.js → backend` has BOTH values and the
  deployed site shows the new build tag; check Supabase project status = Active.
- **Free project pauses after ~1 week of zero activity** → Supabase emails you;
  dashboard → *Restore project* (free tier quirk; real usage keeps it awake).
- **Free tier limits** → 500 MB database, 2 GB bandwidth/month, 50k monthly users:
  far beyond a studio's chat/booking traffic.
- **Later hardening** → swap the open `sync_all` policies for Supabase Auth +
  role-based policies (schema comments show where).

**Powered By RocAudio™ Tech Company Europe**
