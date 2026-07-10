#!/usr/bin/env node
/**
 * Brickonaut Leak-Bot - Poster-Skript (Phase 3).
 *
 * Nimmt einen Fund entgegen und postet ihn über alle konfigurierten Adapter:
 *   - WhatsApp: WHATSAPP_API_URL + WHATSAPP_API_TOKEN + WHATSAPP_CHANNEL_ID
 *     (Drittanbieter wie Whapi.cloud, da Meta keine offizielle Channel-API bietet)
 *   - Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (Default "@brickdex"),
 *     offizielle Bot-API, kostenlos
 *
 * Beide Adapter laufen unabhängig: Fehler des einen blockieren den anderen
 * nicht. Ist KEIN Adapter konfiguriert, wird nur in die Konsole geloggt,
 * damit sich die Pipeline gefahrlos testen lässt.
 *
 * Aufruf:
 *   node post-leak.mjs --type leak|deal|news --title "…" --body "…"
 *     [--url "…"] [--price 99.99] [--rrp 149.99]
 *     [--lang de|en|both] [--title-en "…"] [--body-en "…"]
 *
 * --lang (Default: Env BOT_LANG oder "de"):
 *   de   -> nur --title/--body
 *   en   -> --title-en/--body-en, falls vorhanden, sonst --title/--body
 *   both -> DE-Block + EN-Block, wenn --title-en/--body-en übergeben wurden,
 *           sonst nur die vorhandene Sprache
 */

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1] ?? "";
      i++;
    }
  }
  return args;
}

const TYPE_ICONS = { deal: "💸", news: "📰", leak: "🔍" };

/** Sprachblöcke (Titel+Body) je nach --lang auflösen. */
function resolveBlocks({ lang, title, body, titleEn, bodyEn }) {
  const de = { title, body };
  const en = titleEn || bodyEn ? { title: titleEn || title, body: bodyEn ?? body } : null;
  if (lang === "en") return [en ?? de];
  if (lang === "both" && en) return [de, en];
  return [de];
}

/** Plain-Text-Format (WhatsApp-Markdown-Fettung mit *…*, auch für Konsole). */
function formatPlain({ type, blocks, url, price, rrp }) {
  const icon = TYPE_ICONS[type] ?? TYPE_ICONS.leak;
  const lines = [];
  blocks.forEach((block, i) => {
    if (i > 0) lines.push("");
    lines.push(`${icon} *${block.title}*`);
    if (block.body) lines.push("", block.body);
  });
  if (price) {
    const discount = rrp ? ` (-${Math.round((1 - price / rrp) * 100)}% | UVP ${rrp} €)` : "";
    lines.push("", `➡️ *${price} €*${discount}`);
  }
  if (url) lines.push("", url);
  lines.push("", "- Brickonaut Leak-Bot");
  return lines.join("\n");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Telegram-Format (parse_mode HTML: Titel fett, Link als <a>). */
function formatTelegramHtml({ type, blocks, url, price, rrp }) {
  const icon = TYPE_ICONS[type] ?? TYPE_ICONS.leak;
  const lines = [];
  blocks.forEach((block, i) => {
    if (i > 0) lines.push("");
    lines.push(`${icon} <b>${escapeHtml(block.title)}</b>`);
    if (block.body) lines.push("", escapeHtml(block.body));
  });
  if (price) {
    const discount = rrp ? ` (-${Math.round((1 - price / rrp) * 100)}% | UVP ${rrp} €)` : "";
    lines.push("", `➡️ <b>${price} €</b>${discount}`);
  }
  if (url) lines.push("", `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`);
  lines.push("", "- Brickonaut Leak-Bot");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

function whatsappConfig() {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_API_TOKEN;
  const channelId = process.env.WHATSAPP_CHANNEL_ID;
  if (!apiUrl || !token || !channelId) return null;
  return { apiUrl, token, channelId };
}

async function postToWhatsApp(message, { apiUrl, token, channelId }) {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: channelId, body: message }),
  });
  if (!res.ok) {
    throw new Error(`WhatsApp-API antwortete mit ${res.status}: ${await res.text()}`);
  }
}

function telegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  return { token, chatId: process.env.TELEGRAM_CHAT_ID || "@brickdex" };
}

async function postToTelegram(message, { token, chatId }) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Telegram-API antwortete mit ${res.status}: ${await res.text()}`);
  }
  const data = await res.json().catch(() => null);
  if (data && data.ok === false) {
    throw new Error(`Telegram-API meldet Fehler: ${data.description ?? "unbekannt"}`);
  }
}

// ---------------------------------------------------------------------------
// Hauptlauf
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  if (!args.title) {
    console.error("Fehler: --title ist erforderlich. Siehe README.md.");
    process.exit(1);
  }

  const lang = (args.lang ?? process.env.BOT_LANG ?? "de").toLowerCase();
  if (!["de", "en", "both"].includes(lang)) {
    console.error(`Fehler: --lang muss de, en oder both sein (erhalten: "${lang}").`);
    process.exit(1);
  }

  const content = {
    type: args.type ?? "leak",
    blocks: resolveBlocks({
      lang,
      title: args.title,
      body: args.body ?? "",
      titleEn: args["title-en"],
      bodyEn: args["body-en"],
    }),
    url: args.url,
    price: args.price ? Number(args.price) : undefined,
    rrp: args.rrp ? Number(args.rrp) : undefined,
  };

  const whatsapp = whatsappConfig();
  const telegram = telegramConfig();

  if (!whatsapp && !telegram) {
    console.log("[leak-bot] Kein Adapter konfiguriert (WhatsApp/Telegram) - Konsolen-Ausgabe:\n");
    console.log(formatPlain(content));
    console.log("\n[leak-bot] Gepostet via console.");
    return;
  }

  const posted = [];
  const failed = [];

  if (whatsapp) {
    try {
      await postToWhatsApp(formatPlain(content), whatsapp);
      posted.push("whatsapp");
    } catch (err) {
      failed.push("whatsapp");
      console.error(`[leak-bot] WhatsApp-Fehler: ${err.message}`);
    }
  }

  if (telegram) {
    try {
      await postToTelegram(formatTelegramHtml(content), telegram);
      posted.push("telegram");
    } catch (err) {
      failed.push("telegram");
      console.error(`[leak-bot] Telegram-Fehler: ${err.message}`);
    }
  }

  if (posted.length > 0) console.log(`[leak-bot] Gepostet via ${posted.join(", ")}.`);
  if (failed.length > 0) console.error(`[leak-bot] Fehlgeschlagen: ${failed.join(", ")}.`);
  if (posted.length === 0) process.exit(1); // kein konfigurierter Adapter kam durch
}

main().catch((err) => {
  console.error(`[leak-bot] Unerwarteter Fehler: ${err.message}`);
  process.exit(1);
});
