"use client";

/**
 * Set-Wunschliste - KONTO-GEBUNDEN, kein localStorage-Fallback.
 *
 * Anders als Portfolio/Preisalarm (die im Demo-Modus lokal speichern) ist die
 * Wunschliste bewusst nur fuer echte, eingeloggte Supabase-Konten verfuegbar.
 * Ist Supabase nicht konfiguriert ODER niemand eingeloggt, liefern add/remove
 * { needsLogin: true } und get eine leere Liste - die UI leitet dann auf
 * /registrieren. Der Zugriff ist zusaetzlich per RLS abgesichert (nur eigene
 * Zeilen, siehe supabase/wishlist.sql).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowser, supabaseConfigured } from "./supabase/client";

/** Rueckgabe von add/remove, wenn kein echtes Konto eingeloggt ist. */
export interface NeedsLogin {
  needsLogin: true;
}

export function needsLogin(value: unknown): value is NeedsLogin {
  return Boolean(value && typeof value === "object" && "needsLogin" in value);
}

export interface WishlistItem {
  /** DB-Zeilen-ID (uuid) */
  id: string;
  /** Katalog- oder kuratierte Set-ID, z. B. "10188" oder "10001-1" */
  setId: string;
  /** Namens-Snapshot zum Zeitpunkt des Merkens */
  name: string;
  img?: string;
  addedAt: string;
}

interface DbRow {
  id: string;
  set_id: string;
  set_name: string | null;
  img?: string | null;
  created_at: string;
}

function fromRow(row: DbRow): WishlistItem {
  return {
    id: row.id,
    setId: row.set_id,
    name: row.set_name ?? row.set_id,
    img: row.img ?? undefined,
    addedAt: row.created_at,
  };
}

/** Supabase-Client + User-ID, wenn konfiguriert UND eingeloggt - sonst null. */
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
  return { supabase, userId };
}

async function fetchDb(ctx: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<WishlistItem[]> {
  const { data, error } = await ctx.supabase
    .from("wishlist_items")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DbRow[]).map(fromRow);
}

/* ---------- Live-Update-Event (optional) ---------- */

const WISHLIST_EVENT = "bricktopia:wishlist-change";

/** Meldet allen Hoerern, dass sich die Wunschliste geaendert hat. */
function emitWishlistChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WISHLIST_EVENT));
}

/**
 * Abonniert Aenderungen der Wunschliste (add/remove in dieser Sitzung).
 * Rueckgabe: Unsubscribe-Funktion (fuer useEffect-Cleanup).
 */
export function onWishlistChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(WISHLIST_EVENT, cb);
  return () => window.removeEventListener(WISHLIST_EVENT, cb);
}

/* ---------- oeffentliche API (async) ---------- */

/** Wunschliste des eingeloggten Nutzers - sonst leere Liste. */
export async function getWishlist(): Promise<WishlistItem[]> {
  const ctx = await dbContext();
  if (!ctx) return [];
  return fetchDb(ctx);
}

/** true, wenn das Set bereits auf der Wunschliste steht. */
export async function isInWishlist(setId: string): Promise<boolean> {
  const ctx = await dbContext();
  if (!ctx) return false;
  const { data } = await ctx.supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", ctx.userId)
    .eq("set_id", setId)
    .limit(1);
  return Boolean(data && data.length > 0);
}

/**
 * Set zur Wunschliste hinzufuegen. Ohne echtes Konto: { needsLogin: true }.
 * Doppelte Eintraege werden durch unique(user_id, set_id) verhindert -
 * ein Konflikt wird still ignoriert (upsert-artig).
 */
export async function addToWishlist(input: {
  setId: string;
  name: string;
  img?: string;
}): Promise<WishlistItem[] | NeedsLogin> {
  const ctx = await dbContext();
  if (!ctx) return { needsLogin: true };
  await ctx.supabase
    .from("wishlist_items")
    .upsert(
      {
        user_id: ctx.userId,
        set_id: input.setId,
        set_name: input.name,
        img: input.img ?? null,
      },
      { onConflict: "user_id,set_id", ignoreDuplicates: true }
    );
  emitWishlistChange();
  return fetchDb(ctx);
}

/** Set von der Wunschliste entfernen. Ohne echtes Konto: { needsLogin: true }. */
export async function removeFromWishlist(
  setId: string
): Promise<WishlistItem[] | NeedsLogin> {
  const ctx = await dbContext();
  if (!ctx) return { needsLogin: true };
  await ctx.supabase
    .from("wishlist_items")
    .delete()
    .eq("user_id", ctx.userId)
    .eq("set_id", setId);
  emitWishlistChange();
  return fetchDb(ctx);
}
