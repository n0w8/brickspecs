"use client";

/**
 * Referral-Programm, Client-Seite.
 *
 * Ablauf:
 * 1. Besucher kommt ueber https://brickspecs.com/?ref=CODE - der Code wird
 *    mit Zeitstempel im localStorage vorgemerkt (90 Tage gueltig).
 * 2. Sobald der Besucher eingeloggt ist (Login oder Registrierung), wird der
 *    vorgemerkte Code einmalig still an POST /api/referral/claim geschickt.
 *    Der Server setzt profiles.referred_by, wenn es noch nicht gesetzt ist.
 *
 * Null-Sicherheit: Ohne Supabase-Konfiguration passiert hier nichts.
 */

import { supabaseConfigured } from "./supabase/client";

const REF_KEY = "bricktopia.ref";

/** Zuordnung haelt 90 Tage - danach verfaellt der vorgemerkte Code. */
const REF_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

/** Referral-Codes sind 8 Hex-Zeichen; grosszuegig validieren, streng speichern. */
const CODE_PATTERN = /^[a-z0-9]{4,32}$/i;

interface StoredRef {
  code: string;
  /** Unix-Millisekunden der Erfassung */
  ts: number;
}

/** Normalisiert einen Code aus der URL, null wenn unbrauchbar. */
export function normalizeRefCode(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toLowerCase();
  return CODE_PATTERN.test(code) ? code : null;
}

/** Merkt einen Referral-Code mit Zeitstempel vor (ueberschreibt aeltere). */
export function storeRefCode(code: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeRefCode(code);
  if (!normalized) return;
  const entry: StoredRef = { code: normalized, ts: Date.now() };
  try {
    window.localStorage.setItem(REF_KEY, JSON.stringify(entry));
  } catch {
    // Speicher voll o. ae. - Referral ist nice-to-have, nie blockierend.
  }
}

/** Vorgemerkter, noch gueltiger Code - abgelaufene Marker werden entfernt. */
export function getPendingRefCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<StoredRef>;
    const code = normalizeRefCode(entry.code);
    const ts = typeof entry.ts === "number" ? entry.ts : 0;
    if (!code || Date.now() - ts > REF_MAX_AGE_MS) {
      window.localStorage.removeItem(REF_KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

/** Entfernt den vorgemerkten Code (nach erfolgreichem Claim). */
export function clearRefCode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REF_KEY);
  } catch {
    // ignorieren
  }
}

/**
 * Versucht einmalig, den vorgemerkten Code dem eingeloggten Nutzer zuzuordnen.
 * Still: Fehler werden ignoriert; der Marker bleibt bei Netzwerkfehlern
 * erhalten (naechster Seitenaufruf versucht es erneut) und wird nur bei
 * einer endgueltigen Server-Antwort entfernt.
 */
export async function claimPendingReferral(): Promise<void> {
  if (!supabaseConfigured()) return;
  const code = getPendingRefCode();
  if (!code) return;
  try {
    const res = await fetch("/api/referral/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    // 2xx (zugeordnet oder bereits zugeordnet) und endgueltige Client-Fehler
    // (unbekannter/eigener Code) beenden den Vorgang - Marker weg.
    if (res.ok || res.status === 400 || res.status === 404) {
      clearRefCode();
    }
  } catch {
    // Netzwerkfehler: Marker behalten, spaeter erneut versuchen.
  }
}
