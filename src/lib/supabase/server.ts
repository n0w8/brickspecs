// Supabase-Clients für Server-Code (Route-Handler, Server-Komponenten).
// NUR aus Server-Code importieren.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Nutzer-gebundener Client (liest die Auth-Session aus den Cookies).
 * Liefert null, solange Supabase nicht konfiguriert ist.
 */
export async function getSupabaseServer(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // In Server-Komponenten sind Cookie-Schreibzugriffe nicht erlaubt -
          // die Session wird dann von der Middleware aktualisiert.
        }
      },
    },
  });
}

/**
 * Admin-Client mit service_role-Schlüssel: umgeht RLS. AUSSCHLIESSLICH für
 * vertrauenswürdige Server-Aktionen (Stripe-Webhook, Founder-Vergabe).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
