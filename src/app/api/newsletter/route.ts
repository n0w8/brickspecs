import { NextResponse } from "next/server";

/**
 * Newsletter-Anmeldung via Brevo (https://developers.brevo.com).
 *
 * - Ohne BREVO_API_KEY: 503 mit freundlicher "kommt bald"-Message, damit das
 *   Formular auch ohne konfiguriertes Konto gefahrlos live sein kann.
 * - Mit BREVO_DOI_TEMPLATE_ID: DSGVO-freundliches Double-Opt-in
 *   (Brevo schickt eine Bestaetigungs-Mail, erst der Klick traegt ein).
 * - Sonst: direkter Eintrag in die Liste (Single-Opt-in).
 *
 * Antwortformat immer { ok: boolean, message: string }.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BREVO_BASE = "https://api.brevo.com/v3";

/* ---------- Rate-Limit: max. 5 Anmeldungen pro IP und Stunde ---------- */
// Gleiches Muster wie /api/feedback: in-memory, bewusst nicht persistent
// (Serverless-Kaltstart setzt den Zaehler zurueck - fuer ein Formular genug).

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const hitsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hitsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  if (hitsByIp.size > 5000) hitsByIp.clear();
  return false;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function reply(ok: boolean, message: string, status: number) {
  return NextResponse.json({ ok, message }, { status });
}

/** Brevo meldet Doppel-Anmeldungen als Fehler - fuer uns ist das ein Erfolg. */
function isDuplicateError(body: string): boolean {
  return /duplicate|already exist/i.test(body);
}

export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body.email === "string") email = body.email.trim();
  } catch {
    // Kein/kaputtes JSON -> unten als ungueltig behandelt
  }

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return reply(false, "Bitte gib eine gültige E-Mail-Adresse ein.", 400);
  }

  if (isRateLimited(clientIp(request))) {
    return reply(
      false,
      "Zu viele Anmeldungen in kurzer Zeit - bitte versuch es später noch einmal.",
      429
    );
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return reply(false, "Der Newsletter startet in Kürze - schau bald wieder vorbei.", 503);
  }

  const listId = Number(process.env.BREVO_LIST_ID);
  if (!Number.isInteger(listId) || listId <= 0) {
    console.error("[newsletter] BREVO_LIST_ID fehlt oder ist keine gueltige Zahl.");
    return reply(
      false,
      "Anmeldung gerade nicht möglich - bitte versuch es später noch einmal.",
      500
    );
  }

  const doiTemplateId = Number(process.env.BREVO_DOI_TEMPLATE_ID);
  const useDoi = Number.isInteger(doiTemplateId) && doiTemplateId > 0;

  const endpoint = useDoi ? "/contacts/doubleOptinConfirmation" : "/contacts";
  const payload = useDoi
    ? {
        email,
        includeListIds: [listId],
        templateId: doiTemplateId,
        redirectionUrl: "https://brickspecs.com/?newsletter=confirmed",
      }
    : { email, listIds: [listId], updateEnabled: true };

  try {
    const res = await fetch(`${BREVO_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      if (!isDuplicateError(body)) {
        console.error(`[newsletter] Brevo-Fehler HTTP ${res.status}: ${body.slice(0, 300)}`);
        return reply(
          false,
          "Anmeldung gerade nicht möglich - bitte versuch es später noch einmal.",
          502
        );
      }
      // Bereits eingetragen -> als Erfolg werten (faellt durch zum Erfolgs-Reply)
    }

    return reply(
      true,
      useDoi
        ? "Fast geschafft - bitte bestaetige die Mail in deinem Postfach."
        : "Eingetragen! Du bekommst ab jetzt die Alarme.",
      200
    );
  } catch (err) {
    console.error(`[newsletter] Brevo nicht erreichbar: ${(err as Error).message}`);
    return reply(
      false,
      "Anmeldung gerade nicht möglich - bitte versuch es später noch einmal.",
      502
    );
  }
}
