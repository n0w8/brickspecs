-- BrickSpecs Phase 2: Datenbankschema fuer Supabase
-- Einmalig im Supabase SQL-Editor ausfuehren (Dashboard -> SQL Editor -> New query).
-- Idempotent gehalten, kann bei Aenderungen erneut laufen.

-- ---------------------------------------------------------------------------
-- Profile: 1:1 zu auth.users, haelt Plan, Founder-Nummer und Referral-Daten
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  plan text not null default 'free' check (plan in ('free', 'sammler', 'investor', 'founder')),
  plan_billing text check (plan_billing in ('monthly', 'yearly', 'once')),
  founder_number int unique,
  stripe_customer_id text unique,
  referral_code text unique,
  referred_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Portfolio-Eintraege (ersetzt localStorage "bricktopia.portfolio.*")
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  set_id text not null,
  set_name text,
  condition text not null default 'new' check (condition in ('new', 'used')),
  purchase_price_eur numeric,
  purchase_date date,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);
create index if not exists portfolio_items_user_idx on public.portfolio_items (user_id);

-- Preisalarme (ersetzt localStorage "bricktopia.alerts.*")
create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  set_id text not null,
  set_name text,
  target_price_eur numeric not null check (target_price_eur > 0),
  direction text not null default 'below' check (direction in ('below', 'above')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists price_alerts_user_idx on public.price_alerts (user_id);

-- Nachtraege Phase 2a: Anzeige-Felder aus der Phase-1-App (Bild-URL, Notiz,
-- Zustand des Alarms). Idempotent, laeuft auf bestehenden Tabellen sauber durch.
alter table public.portfolio_items add column if not exists img text;
alter table public.portfolio_items add column if not exists note text;
alter table public.price_alerts add column if not exists img text;
alter table public.price_alerts add column if not exists condition text not null default 'new';

-- ---------------------------------------------------------------------------
-- Row Level Security: jeder Nutzer sieht und bearbeitet NUR seine Daten
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.price_alerts enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Plan/Founder/Stripe-Felder darf nur der Server (service_role) aendern:
    and plan = (select p.plan from public.profiles p where p.id = auth.uid())
    and coalesce(founder_number, -1) = coalesce((select p.founder_number from public.profiles p where p.id = auth.uid()), -1)
    and coalesce(stripe_customer_id, '') = coalesce((select p.stripe_customer_id from public.profiles p where p.id = auth.uid()), '')
    -- Referral-Felder ebenso: referred_by wird nur von /api/referral/claim
    -- (service_role) gesetzt, referral_code nur vom Signup-Trigger. Sonst
    -- koennte ein Nutzer sich selbst einem eigenen Zweitkonto zuordnen und
    -- 25% Provision auf die eigenen Zahlungen kassieren.
    and coalesce(referred_by::text, '') = coalesce((select p.referred_by::text from public.profiles p where p.id = auth.uid()), '')
    and coalesce(referral_code, '') = coalesce((select p.referral_code from public.profiles p where p.id = auth.uid()), '')
  );

drop policy if exists "portfolio_all_own" on public.portfolio_items;
create policy "portfolio_all_own" on public.portfolio_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "alerts_all_own" on public.price_alerts;
create policy "alerts_all_own" on public.price_alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Trigger: bei jeder Registrierung automatisch ein Profil anlegen
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, referral_code)
  values (
    new.id,
    new.email,
    -- kurzer, eindeutiger Referral-Code (8 Zeichen)
    substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Referral-Gutschriften: 25% jeder Zahlung eines Geworbenen fuer den Werber.
-- Schreibzugriff NUR ueber service_role (Stripe-Webhook); Nutzer duerfen nur
-- ihre eigenen Gutschriften lesen.
-- ---------------------------------------------------------------------------
create table if not exists public.referral_earnings (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_user_id uuid references public.profiles (id) on delete set null,
  amount_eur numeric not null check (amount_eur >= 0),
  source text not null,
  stripe_event_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);
create index if not exists referral_earnings_referrer_idx on public.referral_earnings (referrer_id);

alter table public.referral_earnings enable row level security;

drop policy if exists "earnings_select_own" on public.referral_earnings;
create policy "earnings_select_own" on public.referral_earnings
  for select using (auth.uid() = referrer_id);
-- bewusst KEINE insert/update-Policies: schreiben kann nur service_role

-- ---------------------------------------------------------------------------
-- Founder Brick: naechste freie Nummer vergeben, hart limitiert auf 500
-- (wird NUR vom Server nach erfolgreicher Stripe-Zahlung aufgerufen)
-- ---------------------------------------------------------------------------
create or replace function public.claim_founder_number(p_user uuid)
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  next_no int;
begin
  select coalesce(max(founder_number), 0) + 1 into next_no
  from public.profiles
  for update;

  if next_no > 500 then
    raise exception 'founder_sold_out';
  end if;

  update public.profiles
  set plan = 'founder', plan_billing = 'once', founder_number = next_no
  where id = p_user;

  return next_no;
end;
$$;
