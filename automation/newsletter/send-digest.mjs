#!/usr/bin/env node
/**
 * BrickSpecs Newsletter-Digest.
 *
 * Liest den redaktionellen Posteingang (automation/leak-bot/inbox.json),
 * sammelt alle neuen Eintraege vom Typ deal/gwp/leak seit dem letzten Versand
 * (Zustand in last-digest.json) und verschickt sie als HTML-Kampagne ueber
 * die Brevo-API an die Newsletter-Liste.
 *
 * - Alle amazon.*-Links bekommen den Partner-Tag (Env AMAZON_AFFILIATE_TAG)
 *   als tag=-Parameter (vorhandener Tag wird ersetzt).
 * - Ohne BREVO_API_KEY: Dry-Run - die komplette Mail wird in die Konsole
 *   geloggt, der Zustand wird NICHT geschrieben (exit 0).
 * - Pro Digest maximal MAX_ITEMS neueste Eintraege (schuetzt vor einer
 *   Riesen-Mail beim allerersten Lauf).
 *
 * Env: BREVO_API_KEY, BREVO_LIST_ID, BREVO_SENDER_EMAIL, AMAZON_AFFILIATE_TAG
 *
 * Reines Node (>= 18), keine npm-Dependencies.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const INBOX_FILE = path.join(SCRIPT_DIR, "..", "leak-bot", "inbox.json");
const STATE_FILE = path.join(SCRIPT_DIR, "last-digest.json");

/** Nur diese Fund-Typen landen im Digest (reine News nicht).
 *  "leak" ist BEWUSST ausgeschlossen: BrickSpecs verbreitet keine Leaks -
 *  RLFM-Partner (LEGO Fan Media) duerfen mit Leaks nichts zu tun haben. */
const DIGEST_TYPES = new Set(["deal", "gwp"]);
/** Obergrenze pro Mail - die neuesten zuerst. */
const MAX_ITEMS = 20;
const EPOCH = "1970-01-01T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Helfer
// ---------------------------------------------------------------------------

async function loadJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`[digest] Warnung: ${path.basename(file)} unlesbar (${err.message}).`);
    }
    return fallback;
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isAmazonUrl(url) {
  try {
    return /(^|\.)amazon\./i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * amazon.*-URLs den PartnerNet-Tag anhaengen (tag=<AMAZON_AFFILIATE_TAG>).
 * Vorhandener tag-Parameter wird ersetzt, andere Parameter bleiben erhalten.
 * Nicht-Amazon-URLs oder fehlender Tag: unveraendert.
 */
function withAffiliateTag(url, tag) {
  if (!url || !tag || !isAmazonUrl(url)) return url;
  const parsed = new URL(url);
  parsed.searchParams.set("tag", tag);
  return parsed.toString();
}

function formatEUR(value) {
  return `${Number(value).toFixed(2).replace(".", ",")} €`;
}

// ---------------------------------------------------------------------------
// HTML-Mail
// ---------------------------------------------------------------------------

const TYPE_BADGES = {
  deal: { label: "💶 DEAL", bg: "rgba(35,164,92,0.18)", color: "#4cd587" },
  gwp: { label: "🎁 GWP", bg: "rgba(246,199,0,0.15)", color: "#f6c700" },
  leak: { label: "🕵️ LEAK", bg: "rgba(42,111,214,0.18)", color: "#7fb0f5" },
};

function renderEntry(entry, tag) {
  const badge = TYPE_BADGES[entry.type] ?? TYPE_BADGES.leak;
  const buyUrl = withAffiliateTag(entry.buyUrl, tag);
  const sourceUrl = withAffiliateTag(entry.url, tag);

  let priceLine = "";
  if (entry.priceEUR != null && entry.priceEUR > 0) {
    const rrpPart =
      entry.rrpEUR != null && entry.rrpEUR > 0 ? ` (UVP ${formatEUR(entry.rrpEUR)})` : "";
    priceLine = `<p style="margin:8px 0 0;font-size:15px;font-weight:bold;color:#4cd587;">${escapeHtml(
      formatEUR(entry.priceEUR) + rrpPart
    )}</p>`;
  }

  const links = [];
  if (buyUrl) {
    links.push(
      `<a href="${escapeHtml(buyUrl)}" style="display:inline-block;margin:10px 10px 0 0;padding:8px 16px;background:#f6c700;color:#16130a;font-weight:bold;font-size:13px;text-decoration:none;border-radius:8px;">🛒 Zum Angebot${isAmazonUrl(buyUrl) && tag ? " *" : ""}</a>`
    );
  }
  if (sourceUrl) {
    links.push(
      `<a href="${escapeHtml(sourceUrl)}" style="display:inline-block;margin:10px 0 0;padding:8px 16px;background:#1a2138;color:#94a0bd;font-size:13px;text-decoration:none;border-radius:8px;border:1px solid #232c47;">Quelle: ${escapeHtml(entry.source ?? "Link")}</a>`
    );
  }

  return `
      <div style="background:#121829;border:1px solid #232c47;border-radius:12px;padding:18px;margin:0 0 14px;">
        <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:bold;letter-spacing:0.4px;background:${badge.bg};color:${badge.color};">${badge.label}</span>
        <h2 style="margin:10px 0 0;font-size:16px;line-height:1.4;color:#f2f4fb;">${escapeHtml(entry.title)}</h2>
        ${entry.body ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#c7cede;">${escapeHtml(entry.body)}</p>` : ""}
        ${priceLine}
        ${links.join("")}
      </div>`;
}

function buildHtml(entries, tag) {
  const dateStr = new Date().toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e1a;">
  <div style="max-width:620px;margin:0 auto;padding:24px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="text-align:center;padding:18px 0 22px;">
      <p style="margin:0;font-size:22px;font-weight:bold;color:#f2f4fb;">🧱👓 BrickSpecs Alarm</p>
      <p style="margin:6px 0 0;font-size:13px;color:#94a0bd;">Deine neuen LEGO-Deals, Gratis-Beigaben und Leaks - ${escapeHtml(dateStr)}</p>
    </div>
${entries.map((entry) => renderEntry(entry, tag)).join("\n")}
    <div style="padding:20px 8px 8px;text-align:center;">
      <p style="margin:0;font-size:11px;line-height:1.7;color:#94a0bd;">
        * Als Amazon-Partner verdienen wir an qualifizierten Verkaeufen.<br>
        Du bekommst diese Mail, weil du dich auf <a href="https://brickspecs.com" style="color:#f6c700;text-decoration:none;">brickspecs.com</a> fuer den Deal- und GWP-Alarm eingetragen hast.<br>
        <a href="{{ unsubscribe }}" style="color:#94a0bd;">Newsletter abmelden</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Brevo-API
// ---------------------------------------------------------------------------

async function brevoPost(pathname, body, apiKey) {
  const res = await fetch(`https://api.brevo.com${pathname}`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Brevo ${pathname}: HTTP ${res.status} - ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

// ---------------------------------------------------------------------------
// Hauptlauf
// ---------------------------------------------------------------------------

async function main() {
  const inbox = await loadJson(INBOX_FILE, []);
  const state = await loadJson(STATE_FILE, {});
  const lastPostedAt = typeof state.lastPostedAt === "string" ? state.lastPostedAt : EPOCH;

  const fresh = inbox
    .filter(
      (entry) =>
        DIGEST_TYPES.has(entry.type) &&
        typeof entry.postedAt === "string" &&
        entry.postedAt > lastPostedAt
    )
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));

  if (fresh.length === 0) {
    console.log(`[digest] Keine neuen Deals/GWPs/Leaks seit ${lastPostedAt} - nichts zu tun.`);
    return;
  }

  const entries = fresh.slice(0, MAX_ITEMS);
  const skipped = fresh.length - entries.length;
  const tag = process.env.AMAZON_AFFILIATE_TAG || "";
  const subject = `🧱 ${entries.length} neue LEGO-Deals & GWPs`;
  const html = buildHtml(entries, tag);

  console.log(
    `[digest] ${fresh.length} neue Eintraege seit ${lastPostedAt}` +
      (skipped > 0 ? ` - ${entries.length} gehen in die Mail, ${skipped} aeltere entfallen.` : ".")
  );

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log("[digest] DRY-RUN (kein BREVO_API_KEY) - Mail nur in der Konsole, Zustand bleibt unveraendert.\n");
    console.log(`Betreff: ${subject}`);
    console.log("--- HTML ---");
    console.log(html);
    return;
  }

  const listId = Number(process.env.BREVO_LIST_ID);
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!Number.isInteger(listId) || listId <= 0) {
    throw new Error("BREVO_LIST_ID fehlt oder ist keine gueltige Zahl.");
  }
  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL fehlt.");
  }

  const campaign = await brevoPost(
    "/v3/emailCampaigns",
    {
      name: `BrickSpecs Digest ${new Date().toISOString().slice(0, 10)}`,
      subject,
      sender: { name: "BrickSpecs", email: senderEmail },
      type: "classic",
      htmlContent: html,
      recipients: { listIds: [listId] },
    },
    apiKey
  );
  await brevoPost(`/v3/emailCampaigns/${campaign.id}/sendNow`, {}, apiKey);

  const newestPostedAt = fresh[0].postedAt;
  await writeFile(
    STATE_FILE,
    JSON.stringify({ lastPostedAt: newestPostedAt }, null, 2) + "\n",
    "utf8"
  );
  console.log(
    `[digest] Kampagne ${campaign.id} versendet (${entries.length} Eintraege). Neuer Stand: ${newestPostedAt}`
  );
}

main().catch((err) => {
  console.error(`[digest] Fehler: ${err.message}`);
  process.exit(1);
});
