"use client";

/**
 * Einmaliger Import der Phase-1-Daten (localStorage) in die Supabase-Tabellen.
 * Wird beim ersten Login eines echten Kontos ausgefuehrt. Die lokalen Daten
 * bleiben unangetastet liegen (Sicherung) - nur ein Marker verhindert, dass
 * derselbe Nutzer doppelt importiert.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const MIGRATED_KEY = "bricktopia.migrated";

interface LocalPortfolioItem {
  setId: string;
  name: string;
  img?: string;
  quantity: number;
  condition: string;
  purchasePriceEUR: number | null;
  addedAt: string;
  note?: string;
}

interface LocalAlertItem {
  setId: string;
  name: string;
  img?: string;
  targetEUR: number;
  condition: string;
  createdAt: string;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function migratedIds(): string[] {
  const raw = window.localStorage.getItem(MIGRATED_KEY);
  return raw ? raw.split(",").filter(Boolean) : [];
}

function markMigrated(userId: string): void {
  const ids = migratedIds();
  if (!ids.includes(userId)) {
    ids.push(userId);
    window.localStorage.setItem(MIGRATED_KEY, ids.join(","));
  }
}

function asCondition(value: string): "new" | "used" {
  return value === "used" ? "used" : "new";
}

function asPrice(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

let inflight: Promise<void> | null = null;
let inflightUser: string | null = null;

/**
 * Importiert Portfolio + Preisalarme des Phase-1-Demo-Benutzers in die DB.
 * Idempotent pro Nutzer (Marker "bricktopia.migrated"), parallel-sicher.
 */
export function ensureLocalDataMigrated(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (migratedIds().includes(userId)) return Promise.resolve();
  if (inflight && inflightUser === userId) return inflight;
  inflightUser = userId;
  inflight = doMigrate(supabase, userId).finally(() => {
    inflight = null;
    inflightUser = null;
  });
  return inflight;
}

async function doMigrate(supabase: SupabaseClient, userId: string): Promise<void> {
  // Demo-Benutzer aus Phase 1 ermitteln - ohne ihn gibt es nichts zu importieren.
  const demo = readJson<{ username?: string }>("bricktopia.user");
  const username = demo?.username;
  if (!username) {
    markMigrated(userId);
    return;
  }

  const portfolio =
    readJson<LocalPortfolioItem[]>(`bricktopia.portfolio.${username}`) ?? [];
  const alerts = readJson<LocalAlertItem[]>(`bricktopia.alerts.${username}`) ?? [];

  if (portfolio.length > 0) {
    const base = portfolio.map((i) => ({
      user_id: userId,
      set_id: i.setId,
      set_name: i.name,
      condition: asCondition(i.condition),
      purchase_price_eur: asPrice(i.purchasePriceEUR),
      quantity: Math.max(1, Math.round(Number(i.quantity) || 1)),
      created_at: i.addedAt || new Date().toISOString(),
    }));
    const full = base.map((row, idx) => ({
      ...row,
      img: portfolio[idx].img ?? null,
      note: portfolio[idx].note ?? null,
    }));
    // img/note sind neuere Spalten (supabase/schema.sql) - falls das deployte
    // Schema sie noch nicht kennt, klappt der zweite Versuch ohne sie.
    const { error } = await supabase.from("portfolio_items").insert(full);
    if (error) {
      const { error: retryError } = await supabase
        .from("portfolio_items")
        .insert(base);
      if (retryError) throw retryError;
    }
  }

  const validAlerts = alerts.filter(
    (a) => Number.isFinite(a.targetEUR) && a.targetEUR > 0
  );
  if (validAlerts.length > 0) {
    const base = validAlerts.map((a) => ({
      user_id: userId,
      set_id: a.setId,
      set_name: a.name,
      target_price_eur: a.targetEUR,
      created_at: a.createdAt || new Date().toISOString(),
    }));
    const full = base.map((row, idx) => ({
      ...row,
      img: validAlerts[idx].img ?? null,
      condition: asCondition(validAlerts[idx].condition),
    }));
    const { error } = await supabase.from("price_alerts").insert(full);
    if (error) {
      const { error: retryError } = await supabase
        .from("price_alerts")
        .insert(base);
      if (retryError) throw retryError;
    }
  }

  markMigrated(userId);
}
