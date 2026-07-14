"use client";

/**
 * Portfolio-Speicher in zwei Modi:
 * - Supabase-Modus (Phase 2): eingeloggte Nutzer lesen/schreiben
 *   public.portfolio_items (RLS: nur eigene Zeilen).
 * - localStorage-Fallback (Phase 1): unveraendert pro Demo-Benutzer,
 *   solange Supabase nicht konfiguriert ist.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getUser } from "./auth";
import { getSupabaseBrowser, supabaseConfigured } from "./supabase/client";
import { ensureLocalDataMigrated } from "./migrate";
import { fetchDbPlan, portfolioLimit } from "./plan";

export type Condition = "new" | "used";

/** Rückgabe von addItem, wenn das Gratis-Limit (5 Sets) erreicht ist. */
export interface LimitReached {
  limitReached: true;
}

export function isLimitReached(value: unknown): value is LimitReached {
  return Boolean(value && typeof value === "object" && "limitReached" in value);
}

export interface PortfolioItem {
  /** eindeutige Zeilen-ID (DB: uuid, lokal: setId + Zeitstempel) */
  lineId: string;
  /** Katalog- oder kuratierte Set-ID, z. B. "10188" oder "10001-1" */
  setId: string;
  /** Namens-Snapshot zum Zeitpunkt des Hinzufügens */
  name: string;
  img?: string;
  quantity: number;
  condition: Condition;
  /** Kaufpreis pro Stück in EUR (null = unbekannt) */
  purchasePriceEUR: number | null;
  addedAt: string;
  note?: string;
}

/* ---------- Supabase-Modus ---------- */

interface DbRow {
  id: string;
  set_id: string;
  set_name: string | null;
  condition: string;
  purchase_price_eur: number | string | null;
  quantity: number;
  created_at: string;
  img?: string | null;
  note?: string | null;
}

function fromRow(row: DbRow): PortfolioItem {
  return {
    lineId: row.id,
    setId: row.set_id,
    name: row.set_name ?? row.set_id,
    img: row.img ?? undefined,
    quantity: row.quantity ?? 1,
    condition: row.condition === "used" ? "used" : "new",
    purchasePriceEUR:
      row.purchase_price_eur === null || row.purchase_price_eur === undefined
        ? null
        : Number(row.purchase_price_eur),
    addedAt: row.created_at,
    note: row.note ?? undefined,
  };
}

/** Liefert Supabase-Client + User-ID, wenn konfiguriert UND eingeloggt. */
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
}): Promise<PortfolioItem[]> {
  const { data, error } = await ctx.supabase
    .from("portfolio_items")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DbRow[]).map(fromRow);
}

/* ---------- localStorage-Fallback ---------- */

function storageKey(): string | null {
  const u = getUser();
  return u ? `bricktopia.portfolio.${u.username}` : null;
}

function getPortfolioLocal(): PortfolioItem[] {
  const key = storageKey();
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PortfolioItem[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(items: PortfolioItem[]): void {
  const key = storageKey();
  if (!key) return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

/* ---------- oeffentliche API (async, beide Modi) ---------- */

export async function getPortfolio(): Promise<PortfolioItem[]> {
  const ctx = await dbContext();
  if (ctx) return fetchDb(ctx);
  return getPortfolioLocal();
}

export async function isInPortfolio(setId: string): Promise<boolean> {
  const ctx = await dbContext();
  if (ctx) {
    const { data } = await ctx.supabase
      .from("portfolio_items")
      .select("id")
      .eq("user_id", ctx.userId)
      .eq("set_id", setId)
      .limit(1);
    return Boolean(data && data.length > 0);
  }
  return getPortfolioLocal().some((i) => i.setId === setId);
}

export async function addItem(input: {
  setId: string;
  name: string;
  img?: string;
  quantity: number;
  condition: Condition;
  purchasePriceEUR: number | null;
  note?: string;
}): Promise<PortfolioItem[] | LimitReached> {
  const ctx = await dbContext();
  if (ctx) {
    // Plan-Limit nur im DB-Modus: Free = max 5 Portfolio-Sets, bezahlte Pläne
    // unbegrenzt. Ein Lesefehler blockiert nie (fail-open).
    const plan = await fetchDbPlan(ctx.supabase, ctx.userId);
    if (plan === "free") {
      const { count, error } = await ctx.supabase
        .from("portfolio_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.userId);
      if (!error && (count ?? 0) >= portfolioLimit("free")) {
        return { limitReached: true };
      }
    }
    const base = {
      user_id: ctx.userId,
      set_id: input.setId,
      set_name: input.name,
      condition: input.condition,
      purchase_price_eur:
        input.purchasePriceEUR !== null && Number.isFinite(input.purchasePriceEUR)
          ? input.purchasePriceEUR
          : null,
      quantity: Math.max(1, Math.round(Number(input.quantity) || 1)),
    };
    // img/note sind neuere Spalten (supabase/schema.sql) - falls das deployte
    // Schema sie noch nicht kennt, klappt der zweite Versuch ohne sie.
    const { error } = await ctx.supabase
      .from("portfolio_items")
      .insert({ ...base, img: input.img ?? null, note: input.note ?? null });
    if (error) await ctx.supabase.from("portfolio_items").insert(base);
    return fetchDb(ctx);
  }

  const items = getPortfolioLocal();
  const item: PortfolioItem = {
    lineId: `${input.setId}-${Date.now().toString(36)}`,
    setId: input.setId,
    name: input.name,
    img: input.img,
    quantity: Math.max(1, Math.round(input.quantity)),
    condition: input.condition,
    purchasePriceEUR: input.purchasePriceEUR,
    addedAt: new Date().toISOString(),
    note: input.note,
  };
  const next = [item, ...items];
  saveLocal(next);
  return next;
}

export async function updateItem(
  lineId: string,
  patch: Partial<PortfolioItem>
): Promise<PortfolioItem[]> {
  const ctx = await dbContext();
  if (ctx) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.quantity !== undefined)
      dbPatch.quantity = Math.max(1, Math.round(Number(patch.quantity) || 1));
    if (patch.condition !== undefined) dbPatch.condition = patch.condition;
    if (patch.purchasePriceEUR !== undefined)
      dbPatch.purchase_price_eur = patch.purchasePriceEUR;
    if (patch.name !== undefined) dbPatch.set_name = patch.name;
    if (Object.keys(dbPatch).length > 0) {
      await ctx.supabase
        .from("portfolio_items")
        .update(dbPatch)
        .eq("id", lineId)
        .eq("user_id", ctx.userId);
    }
    return fetchDb(ctx);
  }

  const next = getPortfolioLocal().map((i) =>
    i.lineId === lineId ? { ...i, ...patch } : i
  );
  saveLocal(next);
  return next;
}

export async function removeItem(lineId: string): Promise<PortfolioItem[]> {
  const ctx = await dbContext();
  if (ctx) {
    await ctx.supabase
      .from("portfolio_items")
      .delete()
      .eq("id", lineId)
      .eq("user_id", ctx.userId);
    return fetchDb(ctx);
  }

  const next = getPortfolioLocal().filter((i) => i.lineId !== lineId);
  saveLocal(next);
  return next;
}
