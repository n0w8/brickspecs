import { NextResponse } from "next/server";

/**
 * Feedback-Formular (/feedback) -> Transaktionsmail via Brevo.
 *
 * Schutzmechanismen:
 * - Honeypot-Feld "website": von Menschen unsichtbar - ist es gefuellt,
 *   antworten wir mit einem stillen 200, ohne etwas zu verschicken.
 * - Simples In-Memory-Rate-Limit pro IP (max. 5 Nachrichten pro Stunde).
 *   Bewusst nicht persistent: bei Serverless-Kaltstarts beginnt der Zaehler
 *   neu - fuer ein Feedback-Formular voellig ausreichend.
 * - Ohne BREVO_API_KEY: 503 mit freundlicher Meldung (Formular kann trotzdem
 *   gefahrlos live sein).
 *
 * Antwortformat immer { ok: boolean, message: string }.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";
const FEEDBACK_TO = "domsgard1337@gmail.com";

const CATEGORIES = {
  vorschlag: "Vorschlag",
  fehler: "Fehler",
  datenfehler: "Datenfehler",
  sonstiges: "Sonstiges",
} as const;

type CategoryKey = keyof typeof CATEGORIES;

/* ---------- Rate-Limit: max. 5 Nachrichten pro IP und Stunde ---------- */

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
  // Speicher begrenzen, falls viele verschiedene IPs auflaufen
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

export async function POST(request: Request) {
  let category: CategoryKey = "sonstiges";
  let message = "";
  let email = "";
  let page = "";
  let honeypot = "";

  try {
    const body = (await request.json()) as {
      category?: unknown;
      message?: unknown;
      email?: unknown;
      page?: unknown;
      website?: unknown;
    };
    if (typeof body.category === "string" && body.category in CATEGORIES) {
      category = body.category as CategoryKey;
    }
    if (typeof body.message === "string") message = body.message.trim();
    if (typeof body.email === "string") email = body.email.trim();
    if (typeof body.page === "string") page = body.page.trim().slice(0, 300);
    if (typeof body.website === "string") honeypot = body.website.trim();
  } catch {
    // Kein/kaputtes JSON -> unten als ungueltig behandelt
  }

  // Honeypot gefuellt -> Bot. Stilles 200, damit der Bot nichts lernt.
  if (honeypot) {
    return reply(true, "Danke für dein Feedback!", 200);
  }

  if (message.length < 10 || message.length > 2000) {
    return reply(
      false,
      "Bitte beschreibe dein Anliegen mit 10 bis 2000 Zeichen.",
      400
    );
  }

  if (email && (email.length > 254 || !EMAIL_RE.test(email))) {
    return reply(false, "Bitte gib eine gültige E-Mail-Adresse ein (oder lass das Feld leer).", 400);
  }

  if (isRateLimited(clientIp(request))) {
    return reply(
      false,
      "Zu viele Nachrichten in kurzer Zeit - bitte versuch es in einer Stunde noch einmal.",
      429
    );
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return reply(
      false,
      "Das Feedback-Formular ist noch nicht angeschlossen - bitte schreib uns direkt an office@fuchsmedia.at.",
      503
    );
  }

  const textLines = [
    `Kategorie: ${CATEGORIES[category]}`,
    `Absender: ${email || "(keine E-Mail angegeben)"}`,
    `Seite: ${page || "(unbekannt)"}`,
    "",
    "Nachricht:",
    message,
  ];

  try {
    const res = await fetch(BREVO_SEND_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "BrickSpecs Feedback", email: FEEDBACK_TO },
        to: [{ email: FEEDBACK_TO }],
        ...(email ? { replyTo: { email } } : {}),
        subject: `[BrickSpecs Feedback] ${CATEGORIES[category]}`,
        textContent: textLines.join("\n"),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[feedback] Brevo-Fehler HTTP ${res.status}: ${body.slice(0, 300)}`);
      return reply(
        false,
        "Senden gerade nicht möglich - bitte versuch es später noch einmal.",
        502
      );
    }

    return reply(true, "Danke für dein Feedback! Wir lesen jede Nachricht.", 200);
  } catch (err) {
    console.error(`[feedback] Brevo nicht erreichbar: ${(err as Error).message}`);
    return reply(
      false,
      "Senden gerade nicht moeglich - bitte versuch es spaeter noch einmal.",
      502
    );
  }
}
