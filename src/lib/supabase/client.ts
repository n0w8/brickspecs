// Supabase-Client für Client-Komponenten (Browser).
// Liefert null, solange die Env-Variablen noch nicht gesetzt sind -
// so bleibt die Seite auch ohne Supabase-Konfiguration voll lauffähig.

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cached = url && key ? createBrowserClient(url, key) : null;
  return cached;
}

/** true, sobald Supabase konfiguriert ist (Phase 2 aktiv). */
export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
