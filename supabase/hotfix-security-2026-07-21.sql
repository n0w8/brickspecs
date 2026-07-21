-- BrickSpecs Security-Hotfix 21.07.2026 (Befunde des Security-/Paywall-Audits)
-- Einmalig im Supabase SQL-Editor ausfuehren. Idempotent.
--
-- Fix 1 (KRITISCH): claim_founder_number war (a) fuer anon/authenticated per
--   RPC aufrufbar (Default-EXECUTE auf public-Funktionen) -> Gratis-Founder an
--   Stripe vorbei, und (b) enthielt ungueltiges SQL (FOR UPDATE mit Aggregat),
--   das erst zur Laufzeit crasht -> Kaeufer haette gezahlt und nichts bekommen.
--   Neu: Advisory-Lock (race-sicher), Fehler bei unbekanntem Profil, EXECUTE
--   nur noch fuer service_role.
-- Fix 2: increment_set_view fuer anon/authenticated sperren (Zaehler-Spam).
-- Fix 3: Free-Limits (5 Portfolio-Sets, 3 Preisalarme) serverseitig per
--   Trigger erzwingen - bisher nur Client-seitig und per Direkt-API umgehbar.

-- ---------------------------------------------------------------------------
-- Fix 1: Founder-Vergabe reparieren + absperren
-- ---------------------------------------------------------------------------
create or replace function public.claim_founder_number(p_user uuid)
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  next_no int;
begin
  -- Serialisierung: verhindert doppelte Nummern bei parallelen Zahlungen.
  perform pg_advisory_xact_lock(hashtext('claim_founder_number'));

  select coalesce(max(founder_number), 0) + 1 into next_no
  from public.profiles;

  if next_no > 500 then
    raise exception 'founder_sold_out';
  end if;

  update public.profiles
  set plan = 'founder', plan_billing = 'once', founder_number = next_no
  where id = p_user;

  if not found then
    raise exception 'profile_not_found';
  end if;

  return next_no;
end;
$$;

revoke execute on function public.claim_founder_number(uuid) from public, anon, authenticated;
grant execute on function public.claim_founder_number(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Fix 2: View-Zaehler nur noch fuer den Server
-- ---------------------------------------------------------------------------
revoke execute on function public.increment_set_view(text) from public, anon, authenticated;
grant execute on function public.increment_set_view(text) to service_role;

-- ---------------------------------------------------------------------------
-- Fix 3: Free-Limits in der Datenbank erzwingen
-- ---------------------------------------------------------------------------
create or replace function public.enforce_free_limits()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_plan text;
  cnt int;
begin
  select plan into user_plan from public.profiles where id = new.user_id;
  if coalesce(user_plan, 'free') = 'free' then
    if tg_table_name = 'portfolio_items' then
      select count(*) into cnt from public.portfolio_items where user_id = new.user_id;
      if cnt >= 5 then
        raise exception 'free_limit_portfolio';
      end if;
    elsif tg_table_name = 'price_alerts' then
      select count(*) into cnt from public.price_alerts where user_id = new.user_id;
      if cnt >= 3 then
        raise exception 'free_limit_alerts';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists portfolio_free_limit on public.portfolio_items;
create trigger portfolio_free_limit
  before insert on public.portfolio_items
  for each row execute function public.enforce_free_limits();

drop trigger if exists alerts_free_limit on public.price_alerts;
create trigger alerts_free_limit
  before insert on public.price_alerts
  for each row execute function public.enforce_free_limits();

-- ---------------------------------------------------------------------------
-- Gegenprobe (Ergebnis muss ueberall false sein fuer anon/authenticated)
-- ---------------------------------------------------------------------------
select
  has_function_privilege('anon', 'public.claim_founder_number(uuid)', 'execute')          as anon_founder,
  has_function_privilege('authenticated', 'public.claim_founder_number(uuid)', 'execute') as auth_founder,
  has_function_privilege('service_role', 'public.claim_founder_number(uuid)', 'execute')  as service_founder,
  has_function_privilege('anon', 'public.increment_set_view(text)', 'execute')            as anon_view,
  has_function_privilege('service_role', 'public.increment_set_view(text)', 'execute')    as service_view;
