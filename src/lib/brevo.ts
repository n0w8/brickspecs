// Brevo-Helfer fuer Server-Code (Admin-Mailversand an alle registrierten Nutzer).
// NUR aus Server-Routen importieren (nutzt BREVO_API_KEY).

const BREVO_BASE = "https://api.brevo.com/v3";

/** Liste der registrierten Nutzer in Brevo (per API angelegt). */
export const BREVO_USERS_LIST_ID = Number(process.env.BREVO_USERS_LIST_ID) || 6;

/** Absenderadresse fuer Massen-Mails. Fuer gute Zustellbarkeit MUSS die Domain
 *  in Brevo authentifiziert sein (SPF/DKIM). Fallback auf den Newsletter-Absender. */
export function brevoSender(): { email: string; name: string } {
  const email =
    process.env.BREVO_BROADCAST_SENDER ||
    process.env.BREVO_SENDER_EMAIL ||
    "news@domsgard.com";
  return { email, name: "BrickSpecs" };
}

function apiKey(): string | null {
  return process.env.BREVO_API_KEY || null;
}

async function brevoFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = apiKey();
  if (!key) throw new Error("BREVO_API_KEY fehlt");
  return fetch(`${BREVO_BASE}${path}`, {
    ...init,
    headers: {
      "api-key": key,
      accept: "application/json",
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

/** Kontaktzahl einer Liste (null bei Fehler / kein Key). */
export async function getListContactCount(listId = BREVO_USERS_LIST_ID): Promise<number | null> {
  if (!apiKey()) return null;
  try {
    const res = await brevoFetch(`/contacts/lists/${listId}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { totalSubscribers?: number };
    return typeof json.totalSubscribers === "number" ? json.totalSubscribers : null;
  } catch {
    return null;
  }
}

/** E-Mails in Batches in die Nutzer-Liste importieren (updateExistingContacts). */
export async function importEmailsToList(
  emails: string[],
  listId = BREVO_USERS_LIST_ID
): Promise<{ ok: boolean; imported: number; error?: string }> {
  if (!apiKey()) return { ok: false, imported: 0, error: "BREVO_API_KEY fehlt" };
  const clean = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (clean.length === 0) return { ok: true, imported: 0 };

  let imported = 0;
  // Brevo-Import: bis zu vielen Kontakten pro Call, wir batchen defensiv zu 500.
  for (let i = 0; i < clean.length; i += 500) {
    const batch = clean.slice(i, i + 500);
    const res = await brevoFetch(`/contacts/import`, {
      method: "POST",
      body: JSON.stringify({
        listIds: [listId],
        updateExistingContacts: true,
        emptyContactsAttributes: false,
        jsonBody: batch.map((email) => ({ email })),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, imported, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    imported += batch.length;
  }
  return { ok: true, imported };
}

/** Erstellt eine E-Mail-Kampagne an die Nutzer-Liste und versendet sie sofort. */
export async function sendBroadcast(input: {
  subject: string;
  html: string;
  listId?: number;
}): Promise<{ ok: boolean; campaignId?: number; error?: string }> {
  if (!apiKey()) return { ok: false, error: "BREVO_API_KEY fehlt" };
  const listId = input.listId ?? BREVO_USERS_LIST_ID;
  const sender = brevoSender();

  try {
    // 1) Kampagne anlegen
    const createRes = await brevoFetch(`/emailCampaigns`, {
      method: "POST",
      body: JSON.stringify({
        name: `BrickSpecs Broadcast ${new Date().toISOString().slice(0, 16)}`,
        subject: input.subject,
        sender,
        htmlContent: input.html,
        recipients: { listIds: [listId] },
      }),
    });
    if (!createRes.ok) {
      const body = await createRes.text();
      return { ok: false, error: `Kampagne anlegen: HTTP ${createRes.status}: ${body.slice(0, 200)}` };
    }
    const { id } = (await createRes.json()) as { id: number };

    // 2) Sofort senden
    const sendRes = await brevoFetch(`/emailCampaigns/${id}/sendNow`, { method: "POST" });
    if (!sendRes.ok && sendRes.status !== 204) {
      const body = await sendRes.text();
      return { ok: false, campaignId: id, error: `Senden: HTTP ${sendRes.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true, campaignId: id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
