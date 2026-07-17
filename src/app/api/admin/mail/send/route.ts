import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";
import { sendBroadcast } from "@/lib/brevo";

/**
 * POST /api/admin/mail/send  { subject, message }  (nur Admins)
 *
 * Baut aus dem Klartext eine schlichte, gebrandete HTML-Mail (inkl. Pflicht-
 * Abmeldelink) und versendet sie sofort als Brevo-Kampagne an alle Nutzer.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(subject: string, message: string): string {
  const body = escapeHtml(message).replace(/\r?\n/g, "<br>");
  return `<!doctype html><html><body style="margin:0;background:#0a0e1a;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#e8ecf5">
  <div style="max-width:560px;margin:0 auto;background:#121829;border-radius:16px;overflow:hidden;border:1px solid #232c44">
    <div style="background:#f6c700;color:#0a0e1a;padding:16px 24px;font-weight:800;font-size:20px">🧱 BrickSpecs</div>
    <div style="padding:24px;line-height:1.6;font-size:15px">
      <h1 style="font-size:19px;margin:0 0 14px">${escapeHtml(subject)}</h1>
      <div>${body}</div>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #232c44;font-size:12px;color:#8b93a7">
      Du bekommst diese Mail als registrierter BrickSpecs-Nutzer.
      <a href="{{ unsubscribe }}" style="color:#8b93a7">Abmelden</a> &middot;
      Fuchs Media GmbH
    </div>
  </div></body></html>`;
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!isAdminUser(data.user?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let subject = "";
  let message = "";
  try {
    const body = (await request.json()) as { subject?: unknown; message?: unknown };
    if (typeof body.subject === "string") subject = body.subject.trim();
    if (typeof body.message === "string") message = body.message.trim();
  } catch {
    // faellt unten als ungueltig durch
  }
  if (subject.length < 2 || message.length < 2) {
    return NextResponse.json({ error: "Betreff und Nachricht sind Pflicht." }, { status: 400 });
  }
  if (subject.length > 200) subject = subject.slice(0, 200);

  const result = await sendBroadcast({ subject, html: buildHtml(subject, message) });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Versand fehlgeschlagen" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, campaignId: result.campaignId });
}
