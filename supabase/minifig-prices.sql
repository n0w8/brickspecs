-- BrickSpecs: Minifiguren-Preise (6-Monats-Verkaufsschnitt, neu + gebraucht)
-- Separate Datei zu supabase/schema.sql, damit der Minifig-Preis-Teil
-- unabhaengig deployt werden kann. Einmalig im Supabase SQL-Editor ausfuehren
-- (Dashboard -> SQL Editor -> New query). Idempotent gehalten, kann bei
-- Aenderungen erneut laufen. NICHT vom Sync-Skript ausgefuehrt.
--
-- Befuellt vom taeglichen Sync-Job (scripts/sync-minifig-prices.mjs) ueber die
-- BrickLink Price-Guide-API (guide_type=sold). fig_id = Rebrickable-ID der
-- Minifigur (z. B. "fig-006583"); bricklink_id = zugehoerige BrickLink-ID
-- (z. B. "sw0107"), aufgeloest ueber die Rebrickable-API (external_ids.BrickLink).
-- Lesen darf jeder (anon + authenticated), schreiben nur der Server (service_role).
-- ---------------------------------------------------------------------------

create table if not exists public.minifig_prices (
  fig_id text primary key,
  bricklink_id text,
  new_eur numeric,
  used_eur numeric,
  new_qty int,
  used_qty int,
  currency text not null default 'EUR',
  updated_at timestamptz not null default now()
);

-- Nachschlagen ueber die BrickLink-ID (kuratierte Figuren tragen im Katalog eine
-- BrickLink-artige ID wie "sw0107"; die API darf auch danach suchen koennen).
create index if not exists minifig_prices_bricklink_idx
  on public.minifig_prices (bricklink_id);

alter table public.minifig_prices enable row level security;

drop policy if exists "minifig_prices_select_all" on public.minifig_prices;
create policy "minifig_prices_select_all" on public.minifig_prices
  for select to anon, authenticated using (true);

drop policy if exists "minifig_prices_write_service" on public.minifig_prices;
create policy "minifig_prices_write_service" on public.minifig_prices
  for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Hinweis: Die Fortschritts-Tabelle public.sync_state (Key/Value) wird bereits
-- von supabase/schema.sql angelegt. Der Minifig-Sync nutzt darin den Key
-- "minifig_cursor". Nichts weiter noetig - hier NICHT erneut definieren, um die
-- Policies aus schema.sql nicht zu ueberschreiben.
-- ---------------------------------------------------------------------------
