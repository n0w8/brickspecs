-- BrickSpecs: Herkunftsland der Nutzer (USt/OSS-Uebersicht)
-- Einmalig im Supabase SQL-Editor ausfuehren. Idempotent.
--
-- Zweck: Der Betreiber braucht fuer die EU-Umsatzsteuer (OSS) eine grobe
-- Laender-Uebersicht seiner Nutzer. Gespeichert wird BEWUSST NUR der
-- 2-Buchstaben-ISO-Laendercode (z. B. "DE", "AT") aus dem Vercel-Geo-Header
-- "x-vercel-ip-country" - KEINE IP-Adressen, keine Standortdaten.
-- Der Code wird einmalig beim ersten Besuch nach Login gesetzt und danach
-- nie ueberschrieben (siehe /api/geo).

alter table public.profiles add column if not exists country text;
