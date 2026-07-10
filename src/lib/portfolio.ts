"use client";

/**
 * Portfolio-Speicher (Phase 1: pro Benutzer im localStorage).
 * In Phase 2 wandert das in die Datenbank hinter echter Auth.
 */

import { getUser } from "./auth";

export type Condition = "new" | "used";

export interface PortfolioItem {
  /** eindeutige Zeilen-ID */
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

function storageKey(): string | null {
  const u = getUser();
  return u ? `bricktopia.portfolio.${u.username}` : null;
}

export function getPortfolio(): PortfolioItem[] {
  const key = storageKey();
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PortfolioItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: PortfolioItem[]): void {
  const key = storageKey();
  if (!key) return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function isInPortfolio(setId: string): boolean {
  return getPortfolio().some((i) => i.setId === setId);
}

export function addItem(input: {
  setId: string;
  name: string;
  img?: string;
  quantity: number;
  condition: Condition;
  purchasePriceEUR: number | null;
  note?: string;
}): PortfolioItem[] {
  const items = getPortfolio();
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
  save(next);
  return next;
}

export function updateItem(lineId: string, patch: Partial<PortfolioItem>): PortfolioItem[] {
  const next = getPortfolio().map((i) =>
    i.lineId === lineId ? { ...i, ...patch } : i
  );
  save(next);
  return next;
}

export function removeItem(lineId: string): PortfolioItem[] {
  const next = getPortfolio().filter((i) => i.lineId !== lineId);
  save(next);
  return next;
}
