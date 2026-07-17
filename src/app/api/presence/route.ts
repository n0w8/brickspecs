import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Live-Praesenz ("X gerade online").
 *
 * POST /api/presence  { sid: string, auth?: boolean }
 *   -> Heartbeat: upsertet die Session und liefert { online } (Sessions mit
 *      last_seen in den letzten 3 Minuten).
 * GET  /api/presence
 *   -> nur Anzeige: { online } ohne Heartbeat.
 *
 * Antwort IMMER 200. Ohne Supabase/Tabelle kommt { online: null } - bewusst
 * kein 500, damit weder Seite noch Heartbeat je brechen.
 */

const WINDOW_MS = 3 * 60 * 1000; // "online" = aktiv in den letzten 3 Minuten

async function countOnline(admin: ReturnType<typeof getSupabaseAdmin>): Promise<number | null> {
  if (!admin) return null;
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await admin
    .from("presence")
    .select("session_id", { count: "exact", head: true })
    .gt("last_seen", since);
  if (error) return null;
  return count ?? 0;
}

export async function POST(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ online: null });

  let sid = "";
  let auth = false;
  try {
    const body = (await req.json()) as { sid?: unknown; auth?: unknown };
    if (typeof body.sid === "string") sid = body.sid.slice(0, 64);
    if (typeof body.auth === "boolean") auth = body.auth;
  } catch {
    // kaputtes JSON -> unten als fehlende sid behandelt
  }
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(sid)) {
    return NextResponse.json({ online: await countOnline(admin) });
  }

  try {
    await admin
      .from("presence")
      .upsert(
        { session_id: sid, is_auth: auth, last_seen: new Date().toISOString() },
        { onConflict: "session_id" }
      );
    // Gelegentlich (ca. 3%) alte Zeilen aufraeumen, damit die Tabelle klein bleibt.
    if (Math.random() < 0.03) {
      const stale = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await admin.from("presence").delete().lt("last_seen", stale);
    }
  } catch {
    // Tabelle noch nicht deployt o. Netzfehler -> nur Zaehlung versuchen.
  }

  return NextResponse.json({ online: await countOnline(admin) });
}

export async function GET() {
  const admin = getSupabaseAdmin();
  return NextResponse.json({ online: await countOnline(admin) });
}
