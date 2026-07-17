import { NextResponse } from "next/server";

import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";
import { importEmailsToList } from "@/lib/brevo";

/**
 * POST /api/admin/mail/sync (nur Admins)
 *
 * Traegt alle registrierten Nutzer (auth.users) in die Brevo-Nutzer-Liste ein.
 * updateExistingContacts sorgt dafuer, dass es idempotent ist.
 */
export async function POST() {
  const supabase = await getSupabaseServer();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!isAdminUser(data.user?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY fehlt" }, { status: 503 });
  }

  // Alle Nutzer paginiert einsammeln.
  const emails: string[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data: res, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    for (const u of res.users) if (u.email) emails.push(u.email);
    if (res.users.length < 1000) break; // letzte Seite
  }

  const result = await importEmailsToList(emails);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Import fehlgeschlagen" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, synced: result.imported, totalUsers: emails.length });
}
