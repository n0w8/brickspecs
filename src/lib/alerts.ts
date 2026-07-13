"use client";

/**
 * Preisalarme in zwei Modi:
 * - Supabase-Modus (Phase 2): eingeloggte Nutzer lesen/schreiben
 *   public.price_alerts (RLS: nur eigene Zeilen).
 * - localStorage-Fallback (Phase 1): unveraendert pro Demo-Benutzer,
 *   solange Supabase nicht konfiguriert ist.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getUser } from "./auth";
import { getSupabaseBrowser, supabaseConfigured } from "./supabase/client";
import { ensureLocalDataMigrated } from "./migrate";

export type AlertCondition = "new" | "used";

export interface AlertItem {
  /** eindeutige Alarm-ID (DB: uuid, lokal: setId + Zeitstempel) */
  alertId: string;
  /** Katalog- oder kuratierte Set-ID, z. B. "10188" oder "10001-1" */
  setId: string;
  /** Namens-Snapshot zum Zeitpunkt des Anlegens */
  name: string;
  img?: string;
  /** Wunschpreis in EUR - Alarm gilt als ausgelöst, wenn aktueller Ø-Preis ≤ Ziel */
  targetEUR: number;
  condition: AlertCondition;
  createdAt: string;
}

/* ---------- Supabase-Modus ---------- */

interface DbRow {
  id: string;
  set_id: string;
  set_name: string | null;
  target_price_eur: number | string;
  created_at: string;
  img?: string | null;
  condition?: string | null;
}

function fromRow(row: DbRow): AlertItem {
  return {
    alertId: row.id,
    setId: row.set_id,
    name: row.set_name ?? row.set_id,
    img: row.img ?? undefined,
    targetEUR: Number(row.target_price_eur),
    condition: row.condition === "used" ? "used" : "new",
    createdAt: row.created_at,
  };
}

async function dbContext(): Promise<{
  supabase: SupabaseClient;
  userId: string;
} | null> {
  if (!supabaseConfigured()) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;
  try {
    await ensureLocalDataMigrated(supabase, userId);
  } catch {
    // Import wird beim naechsten Zugriff erneut versucht.
  }
  return { supabase, userId };
}

async function fetchDb(ctx: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<AlertItem[]> {
  const { data, error } = await ctx.supabase
    .from("price_alerts")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DbRow[]).map(fromRow);
}

/* ---------- localStorage-Fallback ---------- */

function storageKey(): string | null {
  const u = getUser();
  return u ? `bricktopia.alerts.${u.username}` : null;
}

function getAlertsLocal(): AlertItem[] {
  const key = storageKey();
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as AlertItem[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(items: AlertItem[]): void {
  const key = storageKey();
  if (!key) return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

/* ---------- oeffentliche API (async, beide Modi) ---------- */

export async function getAlerts(): Promise<AlertItem[]> {
  const ctx = await dbContext();
  if (ctx) return fetchDb(ctx);
  return getAlertsLocal();
}

export async function hasAlert(setId: string): Promise<boolean> {
  const ctx = await dbContext();
  if (ctx) {
    const { data } = await ctx.supabase
      .from("price_alerts")
      .select("id")
      .eq("user_id", ctx.userId)
      .eq("set_id", setId)
      .limit(1);
    return Boolean(data && data.length > 0);
  }
  return getAlertsLocal().some((a) => a.setId === setId);
}

export async function addAlert(input: {
  setId: string;
  name: string;
  img?: string;
  targetEUR: number;
  condition: AlertCondition;
}): Promise<AlertItem[]> {
  const ctx = await dbContext();
  if (ctx) {
    const target = Number.isFinite(input.targetEUR) ? input.targetEUR : 0;
    if (target <= 0) return fetchDb(ctx);
    const base = {
      user_id: ctx.userId,
      set_id: input.setId,
      set_name: input.name,
      target_price_eur: target,
    };
    // img/condition sind neuere Spalten (supabase/schema.sql) - falls das
    // deployte Schema sie noch nicht kennt, klappt der zweite Versuch ohne sie.
    const { error } = await ctx.supabase
      .from("price_alerts")
      .insert({ ...base, img: input.img ?? null, condition: input.condition });
    if (error) await ctx.supabase.from("price_alerts").insert(base);
    return fetchDb(ctx);
  }

  const items = getAlertsLocal();
  const item: AlertItem = {
    alertId: `${input.setId}-${Date.now().toString(36)}`,
    setId: input.setId,
    name: input.name,
    img: input.img,
    targetEUR: Math.max(0, input.targetEUR),
    condition: input.condition,
    createdAt: new Date().toISOString(),
  };
  const next = [item, ...items];
  saveLocal(next);
  return next;
}

export async function updateAlert(
  alertId: string,
  patch: Partial<AlertItem>
): Promise<AlertItem[]> {
  const ctx = await dbContext();
  if (ctx) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.targetEUR !== undefined && Number.isFinite(patch.targetEUR) && patch.targetEUR > 0)
      dbPatch.target_price_eur = patch.targetEUR;
    if (patch.name !== undefined) dbPatch.set_name = patch.name;
    if (Object.keys(dbPatch).length > 0) {
      await ctx.supabase
        .from("price_alerts")
        .update(dbPatch)
        .eq("id", alertId)
        .eq("user_id", ctx.userId);
    }
    if (patch.condition !== undefined) {
      // Separat, weil die Spalte im deployten Schema fehlen kann.
      await ctx.supabase
        .from("price_alerts")
        .update({ condition: patch.condition })
        .eq("id", alertId)
        .eq("user_id", ctx.userId);
    }
    return fetchDb(ctx);
  }

  const next = getAlertsLocal().map((a) =>
    a.alertId === alertId ? { ...a, ...patch } : a
  );
  saveLocal(next);
  return next;
}

export async function removeAlert(alertId: string): Promise<AlertItem[]> {
  const ctx = await dbContext();
  if (ctx) {
    await ctx.supabase
      .from("price_alerts")
      .delete()
      .eq("id", alertId)
      .eq("user_id", ctx.userId);
    return fetchDb(ctx);
  }

  const next = getAlertsLocal().filter((a) => a.alertId !== alertId);
  saveLocal(next);
  return next;
}
