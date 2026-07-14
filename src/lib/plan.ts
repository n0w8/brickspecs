"use client";

/**
 * Mitgliedschafts-Pläne (Phase 1: Demo, pro Benutzer im localStorage).
 * In Phase 2 wandert das in die Datenbank + echte Zahlung (Stripe).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getUser } from "./auth";

export type Plan = "free" | "sammler" | "investor" | "founder";

export type Billing = "monthly" | "yearly" | "lifetime";

export interface PlanRecord {
  plan: Plan;
  billing: Billing;
  activatedAt: string;
  /** Demo-Founder-Nummer, z. B. 28 -> "#028" (nur bei plan === "founder") */
  founderNumber?: number;
}

/** Founder-Brick-Demo: Gesamtauflage und noch verfuegbare Stueck (statisch). */
export const FOUNDER_TOTAL = 500;
export const FOUNDER_REMAINING = 473;

export const PLAN_META: Record<
  Plan,
  { name: { de: string; en: string }; color: string; icon: string }
> = {
  free: { name: { de: "Baumeister", en: "Builder" }, color: "#94a0bd", icon: "🧩" },
  sammler: { name: { de: "Sammler", en: "Collector" }, color: "#f6c700", icon: "📦" },
  investor: { name: { de: "Investor", en: "Investor" }, color: "#7fb0f5", icon: "📈" },
  founder: { name: { de: "Founder Brick", en: "Founder Brick" }, color: "#e8b34b", icon: "🧱" },
};

function storageKey(): string | null {
  const u = getUser();
  return u ? `bricktopia.plan.${u.username}` : null;
}

export function getPlanRecord(): PlanRecord | null {
  if (typeof window === "undefined") return null;
  const key = storageKey();
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PlanRecord) : null;
  } catch {
    return null;
  }
}

/** Aktueller Plan des angemeldeten Benutzers, Default "free". */
export function getPlan(): Plan {
  return getPlanRecord()?.plan ?? "free";
}

export function setPlan(plan: Plan, billing: Billing = "monthly"): PlanRecord | null {
  const key = storageKey();
  if (!key) return null;
  const prev = getPlanRecord();
  const record: PlanRecord = {
    plan,
    billing: plan === "founder" ? "lifetime" : billing,
    activatedAt: new Date().toISOString(),
  };
  if (plan === "founder") {
    // Demo: Nummer bleibt stabil, wenn schon einmal Founder aktiviert wurde.
    record.founderNumber =
      prev?.founderNumber ?? FOUNDER_TOTAL - FOUNDER_REMAINING + 1;
  }
  window.localStorage.setItem(key, JSON.stringify(record));
  return record;
}

/** Formatiert eine Founder-Nummer im "#042"-Stil. */
export function formatFounderNumber(n: number): string {
  return `#${String(n).padStart(3, "0")}`;
}

/* ---------- Limits (Free-Plan) ----------
 * Exportiert fuer die spaetere Integration in Portfolio/Preisalarm.
 * Wird bewusst noch NICHT in anderen Dateien verdrahtet.
 */

/** Maximale Anzahl Portfolio-Sets: Free 5, sonst unbegrenzt. */
export function portfolioLimit(plan: Plan): number {
  return plan === "free" ? 5 : Infinity;
}

/** Maximale Anzahl Preisalarme: Free 3, sonst unbegrenzt. */
export function alertLimit(plan: Plan): number {
  return plan === "free" ? 3 : Infinity;
}

/**
 * Plan des Nutzers aus public.profiles (Supabase-Modus).
 * Liefert null bei Fehlern - Aufrufer behandeln das als "kein Limit",
 * damit ein DB-Schluckauf nie das Hinzufügen blockiert.
 */
export async function fetchDbPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<Plan | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return (["free", "sammler", "investor", "founder"] as const).includes(data.plan as Plan)
    ? (data.plan as Plan)
    : null;
}
