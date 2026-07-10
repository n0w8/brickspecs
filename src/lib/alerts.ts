"use client";

/**
 * Preisalarme (Phase 1: pro Benutzer im localStorage).
 * In Phase 2/3 wandert das in die Datenbank inkl. Push/E-Mail-Benachrichtigung.
 */

import { getUser } from "./auth";

export type AlertCondition = "new" | "used";

export interface AlertItem {
  /** eindeutige Alarm-ID */
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

function storageKey(): string | null {
  const u = getUser();
  return u ? `bricktopia.alerts.${u.username}` : null;
}

export function getAlerts(): AlertItem[] {
  const key = storageKey();
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as AlertItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: AlertItem[]): void {
  const key = storageKey();
  if (!key) return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function hasAlert(setId: string): boolean {
  return getAlerts().some((a) => a.setId === setId);
}

export function addAlert(input: {
  setId: string;
  name: string;
  img?: string;
  targetEUR: number;
  condition: AlertCondition;
}): AlertItem[] {
  const items = getAlerts();
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
  save(next);
  return next;
}

export function updateAlert(alertId: string, patch: Partial<AlertItem>): AlertItem[] {
  const next = getAlerts().map((a) =>
    a.alertId === alertId ? { ...a, ...patch } : a
  );
  save(next);
  return next;
}

export function removeAlert(alertId: string): AlertItem[] {
  const next = getAlerts().filter((a) => a.alertId !== alertId);
  save(next);
  return next;
}
