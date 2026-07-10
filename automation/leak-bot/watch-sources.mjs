#!/usr/bin/env node
/**
 * Brickonaut Leak-Bot - Quellen-Watcher (Phase 3).
 *
 * Zieht LEGO-News/Leaks/Deals aus echten RSS-Feeds, dedupliziert über
 * posted.json, klassifiziert per Titel-Keywords und übergibt neue Funde an
 * post-leak.mjs (postet ohne API-Keys nur in die Konsole - gewollt).
 * Zusätzlich landet jeder Fund in inbox.json - dem redaktionellen
 * Posteingang. inbox.json wird NICHT automatisch in die Website übernommen.
 *
 * Aufruf:
 *   node automation/leak-bot/watch-sources.mjs            # echter Lauf
 *   node automation/leak-bot/watch-sources.mjs --dry-run  # nur anzeigen, nichts schreiben
 *   node automation/leak-bot/watch-sources.mjs --post-types deal,leak
 *
 * --post-types (Default "deal,leak", kommagetrennt): nur diese Typen werden an
 * die Kanäle gepostet - ALLE Funde landen weiterhin in inbox.json. So fluten
 * reine News den Kanal nicht.
 *
 * Reines Node (>= 18), keine npm-Dependencies.
 */

import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import path from "node:path";

const execFileAsync = promisify(execFile);

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const POSTED_FILE = path.join(SCRIPT_DIR, "posted.json");
const INBOX_FILE = path.join(SCRIPT_DIR, "inbox.json");
const POST_SCRIPT = path.join(SCRIPT_DIR, "post-leak.mjs");

/** Gesehene Links behalten (neueste zuletzt); ältere fliegen raus. */
const MAX_POSTED_LINKS = 2000;
/** Beschreibung im Post/Inbox auf ~300 Zeichen kürzen. */
const MAX_BODY_LENGTH = 300;
/** Timeout pro Feed-Abruf. */
const FETCH_TIMEOUT_MS = 20_000;

/** Browser-User-Agent - StoneWars & Co. blocken manche Bot-Clients (403). */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Quellen - einfach erweiterbar (name/feedUrl/homepage). */
const SOURCES = [
  {
    name: "StoneWars",
    feedUrl: "https://www.stonewars.de/feed/",
    homepage: "https://www.stonewars.de",
  },
  {
    name: "Promobricks",
    feedUrl: "https://promobricks.de/feed/",
    homepage: "https://promobricks.de",
  },
  {
    name: "Brick Fanatics",
    feedUrl: "https://www.brickfanatics.com/feed/",
    homepage: "https://www.brickfanatics.com",
  },
  {
    name: "zusammengebaut",
    feedUrl: "https://zusammengebaut.com/feed/",
    homepage: "https://zusammengebaut.com",
  },
];

// ---------------------------------------------------------------------------
// RSS-Parsing (minimal, Regex-basiert - reicht für WordPress-Feeds)
// ---------------------------------------------------------------------------

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "-",
  mdash: "-",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bdquo: "„",
  laquo: "«",
  raquo: "»",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  Auml: "Ä",
  Ouml: "Ö",
  Uuml: "Ü",
  szlig: "ß",
  eacute: "é",
  euro: "€",
  copy: "©",
  trade: "™",
  reg: "®",
};

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

/** CDATA auspacken, Entities dekodieren, HTML-Tags entfernen, Whitespace glätten. */
function cleanText(raw) {
  if (!raw) return "";
  let text = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  text = decodeEntities(text);
  text = text.replace(/<[^>]*>/g, " "); // HTML-Tags raus
  text = decodeEntities(text); // doppelt kodierte Entities (&amp;amp;)
  text = text.replace(/\]\]>/g, " ");
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text, max = MAX_BODY_LENGTH) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + " …";
}

function extractTag(itemXml, tag) {
  const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

/** Zerlegt einen RSS-Feed in Items mit title/link/pubDate/description. */
function parseRss(xml) {
  const items = [];
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  for (const itemXml of itemMatches) {
    const title = cleanText(extractTag(itemXml, "title"));
    const link = cleanText(extractTag(itemXml, "link"));
    const pubDate = cleanText(extractTag(itemXml, "pubDate"));
    const description = truncate(cleanText(extractTag(itemXml, "description")));
    if (title && link) items.push({ title, link, pubDate, description });
  }
  return items;
}

// ---------------------------------------------------------------------------
// Klassifizierung
// ---------------------------------------------------------------------------

const DEAL_KEYWORDS = ["angebot", "rabatt", "deal", "sale", "%"];
const LEAK_KEYWORDS = ["leak", "gerücht", "geruecht", "rumor", "rumour", "erster blick"];

function classify(title) {
  const t = title.toLowerCase();
  if (DEAL_KEYWORDS.some((k) => t.includes(k))) return "deal";
  if (LEAK_KEYWORDS.some((k) => t.includes(k))) return "leak";
  return "news";
}

// ---------------------------------------------------------------------------
// Persistenz (posted.json = Dedupe, inbox.json = redaktioneller Posteingang)
// ---------------------------------------------------------------------------

async function loadJson(file, fallback) {
  try {
    const data = JSON.parse(await readFile(file, "utf8"));
    return Array.isArray(data) ? data : fallback;
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`[watcher] Warnung: ${path.basename(file)} unlesbar (${err.message}) - starte leer.`);
    }
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Feed-Abruf
// ---------------------------------------------------------------------------

async function fetchFeed(source) {
  const res = await fetch(source.feedUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`.trim());
  return res.text();
}

// ---------------------------------------------------------------------------
// Posten via post-leak.mjs (child_process)
// ---------------------------------------------------------------------------

async function postFind(find) {
  // Quellname als Body-Prefix ("[StoneWars] …"), falls noch nicht vorhanden.
  const prefix = `[${find.source}]`;
  const body = find.body.startsWith(prefix) ? find.body : `${prefix} ${find.body}`;
  const args = [
    POST_SCRIPT,
    "--type", find.type,
    "--title", find.title,
    "--body", body,
  ];
  if (find.url) args.push("--url", find.url);
  const { stdout, stderr } = await execFileAsync(process.execPath, args, {
    cwd: SCRIPT_DIR,
    timeout: 30_000,
  });
  if (stdout.trim()) console.log(stdout.trim());
  if (stderr.trim()) console.error(stderr.trim());
}

// ---------------------------------------------------------------------------
// Hauptlauf
// ---------------------------------------------------------------------------

const DEFAULT_POST_TYPES = "deal,leak";

/** CLI-Optionen: --dry-run und --post-types (kommagetrennt). */
function parseCliOptions(argv) {
  const dryRun = argv.includes("--dry-run");
  let raw = DEFAULT_POST_TYPES;
  const idx = argv.indexOf("--post-types");
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith("--")) {
    raw = argv[idx + 1];
  }
  const postTypes = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return { dryRun, postTypes };
}

async function main() {
  const { dryRun, postTypes } = parseCliOptions(process.argv);
  if (dryRun) console.log("[watcher] DRY-RUN - es wird nichts geschrieben und nichts gepostet.\n");
  console.log(`[watcher] Post-Typen für die Kanäle: ${[...postTypes].join(", ") || "(keine)"} - alle Funde gehen zusätzlich in inbox.json.\n`);

  const postedLinks = await loadJson(POSTED_FILE, []);
  const seen = new Set(postedLinks);

  const finds = [];
  const stats = [];

  for (const source of SOURCES) {
    let xml;
    try {
      xml = await fetchFeed(source);
    } catch (err) {
      const reason = err.name === "TimeoutError" ? "Timeout" : err.message;
      console.warn(`[watcher] ${source.name}: NICHT erreichbar (${reason}) - übersprungen.`);
      stats.push({ source: source.name, ok: false, items: 0, fresh: 0, reason });
      continue;
    }

    const items = parseRss(xml);
    // Feeds liefern neueste zuerst - umdrehen, damit chronologisch gepostet wird.
    const freshItems = items.filter((item) => !seen.has(item.link)).reverse();

    for (const item of freshItems) {
      seen.add(item.link);
      finds.push({
        id: randomUUID(),
        type: classify(item.title),
        title: item.title,
        body: item.description || item.title,
        url: item.link,
        source: source.name,
        pubDate: item.pubDate,
      });
    }

    console.log(`[watcher] ${source.name}: OK - ${items.length} Items im Feed, ${freshItems.length} neu.`);
    stats.push({ source: source.name, ok: true, items: items.length, fresh: freshItems.length });
  }

  if (finds.length === 0) {
    console.log("\n[watcher] Keine neuen Funde.");
    return;
  }

  const counts = { deal: 0, leak: 0, news: 0 };
  for (const find of finds) counts[find.type]++;
  const toPost = finds.filter((find) => postTypes.has(find.type));
  console.log(
    `\n[watcher] ${finds.length} neue Funde (${counts.deal} deal, ${counts.leak} leak, ${counts.news} news) - ` +
      `${toPost.length} davon gehen an die Kanäle.\n`
  );

  if (dryRun) {
    for (const find of finds) {
      const marker = postTypes.has(find.type) ? "POST" : "nur Inbox";
      console.log(`  [${find.type}] [${marker}] ${find.source}: ${find.title}`);
      console.log(`         ${find.url}`);
    }
    console.log(
      `\n[watcher] DRY-RUN beendet - ${toPost.length} von ${finds.length} Funden würden gepostet, ` +
        `posted.json/inbox.json unverändert.`
    );
    return;
  }

  // 1) Nur die gewünschten Typen an das Poster-Skript übergeben
  //    (ohne API-Keys: Konsolen-Ausgabe).
  for (const find of toPost) {
    try {
      await postFind(find);
    } catch (err) {
      console.error(`[watcher] Posten fehlgeschlagen für "${find.title}": ${err.message}`);
    }
  }

  // 2) In den redaktionellen Posteingang schreiben (KEIN Auto-Import in die Website).
  const inbox = await loadJson(INBOX_FILE, []);
  const postedAt = new Date().toISOString();
  for (const find of finds) {
    inbox.push({
      id: find.id,
      type: find.type,
      title: find.title,
      body: find.body,
      url: find.url,
      source: find.source,
      postedAt,
    });
  }
  await writeFile(INBOX_FILE, JSON.stringify(inbox, null, 2) + "\n", "utf8");

  // 3) Dedupe-Liste aktualisieren.
  const updatedLinks = [...postedLinks, ...finds.map((f) => f.url)].slice(-MAX_POSTED_LINKS);
  await writeFile(POSTED_FILE, JSON.stringify(updatedLinks, null, 2) + "\n", "utf8");

  console.log(
    `\n[watcher] Fertig: ${toPost.length} von ${finds.length} Funden an die Kanäle gepostet, ` +
      `alle Funde in inbox.json übernommen, posted.json aktualisiert ` +
      `(${updatedLinks.length} bekannte Links).`
  );
}

main().catch((err) => {
  console.error(`[watcher] Unerwarteter Fehler: ${err.message}`);
  process.exit(1);
});
