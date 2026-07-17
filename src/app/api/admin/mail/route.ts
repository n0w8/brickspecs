import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";
import { BREVO_USERS_LIST_ID, brevoSender, getListContactCount } from "@/lib/brevo";

/** GET /api/admin/mail - Kennzahlen fuer das Massen-Mail-Panel (nur Admins). */
export async function GET() {
  const supabase = await getSupabaseServer();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!isAdminUser(data.user?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const contacts = await getListContactCount();
  return NextResponse.json({
    listId: BREVO_USERS_LIST_ID,
    contacts,
    sender: brevoSender().email,
  });
}
