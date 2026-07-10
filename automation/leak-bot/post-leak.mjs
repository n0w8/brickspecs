#!/usr/bin/env node
/**
 * BrickSpecs Leak-Bot - Poster-Skript (Phase 3).
 *
 * Nimmt einen Fund entgegen und postet ihn strukturiert über alle
 * konfigurierten Adapter:
 *   - WhatsApp: WHATSAPP_API_URL + WHATSAPP_API_TOKEN + WHATSAPP_CHANNEL_ID
 *     (Drittanbieter wie Whapi.cloud, da Meta keine offizielle Channel-API bietet)
 *   - Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (Default "@brickspecs"),
 *     offizielle Bot-API, kostenlos. Optional TELEGRAM_CHAT_ID_DE: zweiter
 *     Kanal, bekommt dieselbe Nachricht mit DEUTSCHEN Labels (gleicher Token).
 *
 * Nachrichtenformat (Telegram-HTML, englische Labels):
 *   🔥 <b>DEAL</b> | LEGO Icons
 *   <b>Produktname</b>
 *   Set 10326
 *   💶 214.99 EUR (RRP 269.99 EUR)
 *   📉 -20%
 *   🏪 Shop: Amazon
 *   🛒 Buy: <a href="…">Amazon</a>
 *   ℹ️ Source: <a href="…">StoneWars</a>
 *
 * Amazon-Affiliate: Ist AMAZON_AFFILIATE_TAG gesetzt (z. B. "brickspecs-21"),
 * bekommt jede amazon.*-URL (--buy-url oder --url) den Query-Parameter
 * tag=<WERT>. Ein vorhandener tag-Parameter wird ersetzt, alle anderen
 * Parameter bleiben erhalten. Getaggte Posts bekommen automatisch einen
 * Affiliate-Hinweis (Kennzeichnungspflicht). Ohne Env: URLs unverändert.
 *
 * Beide Adapter laufen unabhängig: Fehler des einen blockieren den anderen
 * nicht. Ist KEIN Adapter konfiguriert, wird nur in die Konsole geloggt,
 * damit sich die Pipeline gefahrlos testen lässt.
 *
 * Aufruf:
 *   node post-leak.mjs --type leak|deal|news --title "…" --body "…"
 *     [--url "…"] [--price 99.99] [--rrp 149.99]
 *     [--set 10326] [--shop Amazon] [--buy-url "…"] [--theme "LEGO Icons"]
 *     [--source StoneWars]
 *     [--lang de|en|both] [--title-en "…"] [--body-en "…"]
 *
 * Alle neuen Args sind optional - ohne sie entsteht ein sauberes einfaches
 * Format (Badge, Titel, Body, ggf. Preis + Quelle).
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

const TYPE_BADGES = {
  deal: { icon: "🔥", label: "DEAL" },
  leak: { icon: "🔍", label: "LEAK" },
  news: { icon: "📰", label: "NEWS" },
};

/** Label-Sets: Haupt-Kanal + WhatsApp englisch, TELEGRAM_CHAT_ID_DE deutsch. */
const LABELS = {
  en: {
    set: "Set",
    rrp: "RRP",
    shop: "Shop",
    buy: "Buy",
    source: "Source",
    money: (value) => `${value.toFixed(2)} EUR`,
    affiliateNote: "* Affiliate link - we may earn a commission.",
  },
  de: {
    set: "Set",
    rrp: "UVP",
    shop: "Shop",
    buy: "Kaufen",
    source: "Quelle",
    money: (value) => `${value.toFixed(2).replace(".", ",")} €`,
    affiliateNote: "* Affiliate-Link - wir erhalten ggf. eine Provision.",
  },
};

/** Sprachblöcke (Titel+Body) je nach --lang auflösen. */
function resolveBlocks({ lang, title, body, titleEn, bodyEn }) {
  const de = { title, body };
  const en = titleEn || bodyEn ? { title: titleEn || title, body: bodyEn ?? body } : null;
  if (lang === "en") return [en ?? de];
  if (lang === "both" && en) return [de, en];
  return [de];
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Hostname ohne "www." als Anzeigename (z. B. "stonewars.de"); null bei Müll. */
function hostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isAmazonUrl(url) {
  try {
    return /(^|\.)amazon\./i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * amazon.*-URLs den PartnerNet-Tag anhängen (tag=<AMAZON_AFFILIATE_TAG>).
 * Vorhandener tag-Parameter wird ersetzt, andere Parameter bleiben erhalten.
 * Nicht-Amazon-URLs und fehlender Tag: unverändert.
 */
function applyAffiliateTag(url, tag) {
  if (!url || !tag || !isAmazonUrl(url)) return { url, tagged: false };
  const parsed = new URL(url);
  parsed.searchParams.set("tag", tag);
  return { url: parsed.toString(), tagged: true };
}

/**
 * Strukturierte Nachricht bauen.
 * html=true  -> Telegram (parse_mode HTML, Links als <a>)
 * html=false -> WhatsApp/Konsole (Plain-Text, *fett*, Links als nackte URL)
 */
function formatMessage(content, labels, { html }) {
  const badge = TYPE_BADGES[content.type] ?? TYPE_BADGES.leak;
  const esc = html ? escapeHtml : (s) => String(s);
  const bold = html ? (s) => `<b>${escapeHtml(s)}</b>` : (s) => `*${s}*`;
  const link = (url, label) =>
    html ? `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>` : url;

  // Kopfzeile: Typ-Badge + optionales Thema.
  const lines = [
    `${badge.icon} ${bold(badge.label)}${content.theme ? ` | ${esc(content.theme)}` : ""}`,
  ];

  // Produktblock: Name fett, darunter Setnummer, dann optionaler Body.
  content.blocks.forEach((block, i) => {
    lines.push("", bold(block.title));
    if (i === 0 && content.set) lines.push(`${labels.set} ${esc(content.set)}`);
    if (block.body) lines.push("", esc(block.body));
  });

  // Info-Block: Preis/Rabatt, Shop, Kauf-Link, Quelle.
  const info = [];
  if (content.price != null) {
    const rrpPart = content.rrp != null ? ` (${labels.rrp} ${labels.money(content.rrp)})` : "";
    info.push(`💶 ${labels.money(content.price)}${rrpPart}`);
    if (content.rrp != null && content.rrp > content.price) {
      info.push(`📉 -${Math.round((1 - content.price / content.rrp) * 100)}%`);
    }
  }
  if (content.shop) info.push(`🏪 ${labels.shop}: ${esc(content.shop)}`);
  if (content.buyUrl) {
    const label = isAmazonUrl(content.buyUrl)
      ? "Amazon"
      : content.shop ?? hostLabel(content.buyUrl) ?? "Link";
    info.push(`🛒 ${labels.buy}: ${link(content.buyUrl, label)}${content.buyTagged ? " *" : ""}`);
  }
  if (content.url) {
    const label = content.source || hostLabel(content.url) || "Link";
    info.push(`ℹ️ ${labels.source}: ${link(content.url, label)}`);
  }
  if (info.length > 0) lines.push("", ...info);

  // Kennzeichnungspflicht: Hinweis, sobald ein Affiliate-Tag gesetzt wurde.
  if (content.buyTagged || content.urlTagged) lines.push("", labels.affiliateNote);

  lines.push("", "- BrickSpecs Leak-Bot");
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
  return {
    token,
    chatId: process.env.TELEGRAM_CHAT_ID || "@brickspecs",
    chatIdDe: process.env.TELEGRAM_CHAT_ID_DE || null,
  };
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

  const num = (value) => {
    if (value === undefined || value === "") return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };

  // Affiliate-Tag auf amazon.*-URLs anwenden (--buy-url UND --url).
  const affiliateTag = process.env.AMAZON_AFFILIATE_TAG;
  const buy = applyAffiliateTag(args["buy-url"], affiliateTag);
  const article = applyAffiliateTag(args.url, affiliateTag);

  const content = {
    type: args.type ?? "leak",
    blocks: resolveBlocks({
      lang,
      title: args.title,
      body: args.body ?? "",
      titleEn: args["title-en"],
      bodyEn: args["body-en"],
    }),
    url: article.url,
    urlTagged: article.tagged,
    buyUrl: buy.url,
    buyTagged: buy.tagged,
    price: num(args.price),
    rrp: num(args.rrp),
    set: args.set,
    shop: args.shop,
    theme: args.theme,
    source: args.source,
  };

  const whatsapp = whatsappConfig();
  const telegram = telegramConfig();

  if (!whatsapp && !telegram) {
    console.log(
      "[leak-bot] Kein Adapter konfiguriert (WhatsApp/Telegram) - Konsolen-Ausgabe (Telegram-HTML, EN):\n"
    );
    console.log(formatMessage(content, LABELS.en, { html: true }));
    if (process.env.TELEGRAM_CHAT_ID_DE) {
      console.log("\n[leak-bot] DE-Variante (TELEGRAM_CHAT_ID_DE):\n");
      console.log(formatMessage(content, LABELS.de, { html: true }));
    }
    console.log("\n[leak-bot] Gepostet via console.");
    return;
  }

  const posted = [];
  const failed = [];

  if (whatsapp) {
    try {
      await postToWhatsApp(formatMessage(content, LABELS.en, { html: false }), whatsapp);
      posted.push("whatsapp");
    } catch (err) {
      failed.push("whatsapp");
      console.error(`[leak-bot] WhatsApp-Fehler: ${err.message}`);
    }
  }

  if (telegram) {
    // Haupt-Kanal: immer die englische Variante.
    try {
      await postToTelegram(formatMessage(content, LABELS.en, { html: true }), {
        token: telegram.token,
        chatId: telegram.chatId,
      });
      posted.push("telegram");
    } catch (err) {
      failed.push("telegram");
      console.error(`[leak-bot] Telegram-Fehler: ${err.message}`);
    }

    // Optionaler zweiter Kanal: deutsche Labels, gleicher Bot-Token.
    if (telegram.chatIdDe) {
      try {
        await postToTelegram(formatMessage(content, LABELS.de, { html: true }), {
          token: telegram.token,
          chatId: telegram.chatIdDe,
        });
        posted.push("telegram-de");
      } catch (err) {
        failed.push("telegram-de");
        console.error(`[leak-bot] Telegram-DE-Fehler: ${err.message}`);
      }
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
