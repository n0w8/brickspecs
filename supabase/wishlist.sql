-- BrickSpecs: Set-Wunschliste (Phase 2)
-- SEPARATE Datei zu supabase/schema.sql - einmalig im Supabase SQL-Editor
-- ausfuehren (Dashboard -> SQL Editor -> New query). Idempotent gehalten,
-- kann bei Aenderungen erneut laufen.
--
-- Setzt voraus, dass public.profiles bereits existiert (siehe schema.sql).

-- ---------------------------------------------------------------------------
-- Wunschliste: gemerkte Traumsets je Nutzer. Konto-gebunden (kein Gast-Zugriff),
-- ein Set pro Nutzer nur einmal (unique). set_name/img sind Anzeige-Snapshots.
-- ---------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  set_id text not null,
  set_name text,
  img text,
  created_at timestamptz not null default now(),
  unique (user_id, set_id)
);

create index if not exists wishlist_items_user_idx on public.wishlist_items (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: jeder Nutzer sieht und bearbeitet NUR seine Wunschliste
-- ---------------------------------------------------------------------------
alter table public.wishlist_items enable row level security;

drop policy if exists "wishlist_all_own" on public.wishlist_items;
create policy "wishlist_all_own" on public.wishlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
