/**
 * Neue-Nutzer-Benachrichtigung (laeuft alle 15 Minuten als GitHub Action).
 *
 * - Findet alle Registrierungen seit dem letzten Lauf (Cursor in
 *   public.sync_state, Key "user_notify_cursor").
 * - Schickt EINE Mail pro Lauf an den Betreiber (NOTIFY_EMAIL, Default
 *   michiges@gmx.at) via Brevo, Absender news@brickspecs.com.
 * - Traegt die neuen Nutzer zusaetzlich in die Brevo-Massenmail-Liste ein
 *   (BREVO_USERS_LIST_ID, Default 6) - so bleibt die Liste automatisch aktuell.
 * - Erster Lauf: setzt nur den Cursor auf "jetzt" (kein Rueckstau-Spam).
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL (oder SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
 *      BREVO_API_KEY, optional NOTIFY_EMAIL, BREVO_USERS_LIST_ID.
 */

const SB_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
const SB_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const BREVO_KEY = (process.env.BREVO_API_KEY || "").trim();
const NOTIFY_EMAIL = (process.env.NOTIFY_EMAIL || "michiges@gmx.at").trim();
const LIST_ID = Number(process.env.BREVO_USERS_LIST_ID) || 6;
const CURSOR_KEY = "user_notify_cursor";

if (!SB_URL || !SB_KEY) {
  console.error("[notify] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen.");
  process.exit(1);
}

const SBH = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function readCursor() {
  const r = await fetch(`${SB_URL}/rest/v1/sync_state?key=eq.${CURSOR_KEY}&select=value`, { headers: SBH });
  if (!r.ok) throw new Error(`sync_state lesen: HTTP ${r.status}`);
  const rows = await r.json();
  return rows[0]?.value ?? null;
}

async function writeCursor(value) {
  const r = await fetch(`${SB_URL}/rest/v1/sync_state`, {
    method: "POST",
    headers: { ...SBH, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key: CURSOR_KEY, value }),
  });
  if (!r.ok) throw new Error(`sync_state schreiben: HTTP ${r.status} ${await r.text()}`);
}

/** Alle Nutzer einsammeln (paginiert; bei kleinen Zahlen 1 Seite). */
async function listUsers() {
  const users = [];
  for (let page = 1; page <= 50; page++) {
    const r = await fetch(`${SB_URL}/auth/v1/admin/users?page=${page}&per_page=1000`, { headers: SBH });
    if (!r.ok) throw new Error(`Nutzerliste: HTTP ${r.status}`);
    const j = await r.json();
    const batch = j.users ?? [];
    users.push(...batch);
    if (batch.length < 1000) break;
  }
  return users;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendMail(newUsers) {
  if (!BREVO_KEY) {
    console.warn("[notify] BREVO_API_KEY fehlt - Mail uebersprungen.");
    return;
  }
  const rows = newUsers
    .map(
      (u) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${esc(u.email ?? "?")}</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #eee;color:#666">${new Date(u.created_at).toLocaleString("de-AT", { timeZone: "Europe/Vienna" })}</td></tr>`
    )
    .join("");
  const n = newUsers.length;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px">
    <h2 style="margin:0 0 12px">🧱 ${n} neue Registrierung${n === 1 ? "" : "en"} bei BrickSpecs</h2>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <tr><th style="text-align:left;padding:6px 12px;border-bottom:2px solid #f6c700">E-Mail</th>
          <th style="text-align:left;padding:6px 12px;border-bottom:2px solid #f6c700">Registriert</th></tr>
      ${rows}
    </table>
    <p style="font-size:12px;color:#888;margin-top:14px">Alle Zahlen im <a href="https://brickspecs.com/admin">Admin-Panel</a>.</p>
  </div>`;

  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "BrickSpecs", email: "news@brickspecs.com" },
      to: [{ email: NOTIFY_EMAIL }],
      subject: `🧱 ${n} neue Registrierung${n === 1 ? "" : "en"} bei BrickSpecs`,
      htmlContent: html,
    }),
  });
  if (!r.ok) throw new Error(`Brevo-Mail: HTTP ${r.status} ${await r.text()}`);
  console.log(`[notify] Mail an ${NOTIFY_EMAIL} verschickt (${n} neue).`);
}

async function importToList(newUsers) {
  if (!BREVO_KEY) return;
  const emails = newUsers.map((u) => u.email).filter(Boolean);
  if (emails.length === 0) return;
  const r = await fetch("https://api.brevo.com/v3/contacts/import", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      listIds: [LIST_ID],
      updateExistingContacts: true,
      emptyContactsAttributes: false,
      jsonBody: emails.map((email) => ({ email })),
    }),
  });
  if (!r.ok) console.warn(`[notify] Listen-Import fehlgeschlagen: HTTP ${r.status}`);
  else console.log(`[notify] ${emails.length} Nutzer in Brevo-Liste ${LIST_ID} importiert.`);
}

(async () => {
  const cursor = await readCursor();
  const now = new Date().toISOString();

  if (!cursor) {
    await writeCursor(now);
    console.log("[notify] Erster Lauf - Cursor gesetzt, keine Mail (kein Rueckstau-Spam).");
    return;
  }

  const users = await listUsers();
  const newUsers = users
    .filter((u) => u.created_at && u.created_at > cursor)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  if (newUsers.length === 0) {
    console.log("[notify] Keine neuen Registrierungen.");
    return;
  }

  await sendMail(newUsers);
  await importToList(newUsers);
  // Cursor auf den neuesten verarbeiteten Nutzer setzen (nicht "now", damit
  // zwischen Abfrage und Mail keine Registrierung verloren geht).
  await writeCursor(newUsers[newUsers.length - 1].created_at);
  console.log(`[notify] Fertig - Cursor auf ${newUsers[newUsers.length - 1].created_at}.`);
})().catch((err) => {
  console.error(`[notify] Fehler: ${err.message}`);
  process.exit(1);
});
