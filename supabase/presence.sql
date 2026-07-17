-- BrickSpecs: Live-Praesenz ("X gerade online")
-- Einmalig im Supabase SQL-Editor ausfuehren. Idempotent.
--
-- Jeder Besucher schickt alle ~60s einen Heartbeat (anonyme Session-ID) an
-- /api/presence. Der Server (service_role) upsertet die Zeile; "online" = Zahl
-- der Sessions mit last_seen in den letzten 3 Minuten. Keine personenbezogenen
-- Daten (nur eine zufaellige, im Browser erzeugte ID). RLS ohne Policies:
-- ausschliesslich der Server-Client (service_role, Bypass) liest/schreibt.

create table if not exists public.presence (
  session_id text primary key,
  is_auth boolean not null default false,
  last_seen timestamptz not null default now()
);

create index if not exists presence_last_seen_idx on public.presence (last_seen);

alter table public.presence enable row level security;
-- bewusst KEINE Policies: anon/authenticated haben keinen Zugriff,
-- nur der service_role-Server umgeht RLS.
