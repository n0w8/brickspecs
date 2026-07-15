#!/usr/bin/env node
/**
 * BrickSpecs BrickLink-Preis-Sync
 *
 * Holt den 6-Monats-Verkaufsschnitt (guide_type=sold) je Set von der BrickLink
 * Store-API - neu (N) UND gebraucht (U) getrennt - und schreibt ihn nach
 * public.set_prices in Supabase. Ein rollierender Cursor (public.sync_state,
 * key "bricklink_cursor") sorgt dafuer, dass ueber mehrere Tagelaeufe der
 * gesamte Katalog abgedeckt wird, ohne das Rate-Limit zu sprengen.
 *
 * Aufruf (voller Lauf):   node scripts/sync-bricklink-prices.mjs
 * Dry-Run (kein Cursor/Upsert-Zwang, Werte nur ausgeben):
 *   node scripts/sync-bricklink-prices.mjs --limit 3
 *   node scripts/sync-bricklink-prices.mjs --sets 10305-1,6552-1,10188-1
 *
 * Env (aus .env.local lokal oder aus process.env in CI):
 *   BRICKLINK_CONSUMER_KEY / BRICKLINK_CONSUMER_SECRET
 *   BRICKLINK_TOKEN / BRICKLINK_TOKEN_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *
 * Es werden NIEMALS Secret-Werte geloggt.
 */

import { createHmac, randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --------------------------------------------------------------------------
// Konfiguration
// --------------------------------------------------------------------------
const BASE_URL = "https://api.bricklink.com/api/store/v1";
const TIMEOUT_MS = 15_000;
// Rate-Limit ~5000 Calls/Tag pro Consumer -> konservativ 3500. 2 Calls/Set.
const DAILY_CALL_BUDGET = 3500;
const MAX_SETS_PER_RUN = Math.floor(DAILY_CALL_BUDGET / 2); // ~1750
const FRESH_DAYS = 30; // Sets, die juenger als 30 Tage aktualisiert sind, ueberspringen
const PACING_MS = 150; // sanfte Pause zwischen einzelnen API-Calls

// --------------------------------------------------------------------------
// .env.local laden (nur was noch nicht in process.env steht; nie loggen)
// --------------------------------------------------------------------------
function loadDotEnvLocal() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue; // Muell-Zeilen ignorieren
    if (process.env[key] !== undefined) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
loadDotEnvLocal();

// --------------------------------------------------------------------------
// Argumente
// --------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { limit: null, sets: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") args.limit = Math.max(1, Number(argv[++i]) || 1);
    else if (argv[i] === "--sets") args.sets = String(argv[++i] || "").split(",").map((s) => s.trim()).filter(Boolean);
  }
  return args;
}
const ARGS = parseArgs(process.argv.slice(2));
const DRY_RUN = ARGS.limit !== null || ARGS.sets !== null;

// --------------------------------------------------------------------------
// BrickLink OAuth 1.0
// --------------------------------------------------------------------------
function credentials() {
  const consumerKey = process.env.BRICKLINK_CONSUMER_KEY;
  const consumerSecret = process.env.BRICKLINK_CONSUMER_SECRET;
  const token = process.env.BRICKLINK_TOKEN;
  const tokenSecret = process.env.BRICKLINK_TOKEN_SECRET;
  if (!consumerKey || !consumerSecret || !token || !tokenSecret) return null;
  return { consumerKey, consumerSecret, token, tokenSecret };
}

function pctEnc(value) {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function buildAuthHeader(creds, urlWithoutQuery, query) {
  const oauth = {
    oauth_consumer_key: creds.consumerKey,
    oauth_token: creds.token,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_version: "1.0",
  };
  const allParams = { ...query, ...oauth };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${pctEnc(k)}=${pctEnc(allParams[k])}`)
    .join("&");
  const baseString = `GET&${pctEnc(urlWithoutQuery)}&${pctEnc(paramString)}`;
  const signingKey = `${pctEnc(creds.consumerSecret)}&${pctEnc(creds.tokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");
  return (
    "OAuth " +
    Object.entries({ ...oauth, oauth_signature: signature })
      .map(([k, v]) => `${pctEnc(k)}="${pctEnc(v)}"`)
      .join(", ")
  );
}

/** Holt den Verkaufsschnitt fuer ein Set. Wirft bei echten Fehlern (Retry/Skip). */
async function getSetPrice(creds, setNo, newOrUsed) {
  const urlWithoutQuery = `${BASE_URL}/items/SET/${encodeURIComponent(setNo)}/price`;
  const query = { guide_type: "sold", new_or_used: newOrUsed, currency_code: "EUR" };
  const authHeader = buildAuthHeader(creds, urlWithoutQuery, query);
  const qs = Object.entries(query)
    .map(([k, v]) => `${pctEnc(k)}=${pctEnc(v)}`)
    .join("&");

  let res;
  try {
    res = await fetch(`${urlWithoutQuery}?${qs}`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const e = new Error(`Netzwerk/Timeout: ${err?.message ?? err}`);
    e.status = 0;
    throw e;
  }

  if (res.status === 404) return { avgEUR: null, qty: 0 };
  const textBody = await res.text();
  let json;
  try {
    json = JSON.parse(textBody);
  } catch {
    const e = new Error(`ungueltige Antwort (HTTP ${res.status})`);
    e.status = res.status;
    throw e;
  }

  const code = json?.meta?.code;
  if (code === 404) return { avgEUR: null, qty: 0 };
  if (code !== 200 || !json.data) {
    const detail = json?.meta?.description ?? json?.meta?.message ?? "Fehler";
    const e = new Error(`meta ${code ?? res.status}: ${detail}`);
    e.status = res.status || 500;
    throw e;
  }

  const rawAvg = json.data.avg_price;
  const avg = rawAvg !== undefined && rawAvg !== "" ? Number(rawAvg) : NaN;
  const avgEUR = Number.isFinite(avg) && avg > 0 ? avg : null;
  const rawQty = json.data.unit_quantity ?? json.data.total_quantity ?? 0;
  const qtyNum = Number(rawQty);
  const qty = Number.isFinite(qtyNum) && qtyNum > 0 ? Math.round(qtyNum) : 0;
  return { avgEUR, qty };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --------------------------------------------------------------------------
// Katalog + Prioritaetsliste
// --------------------------------------------------------------------------
function loadCatalogIds() {
  const raw = JSON.parse(
    readFileSync(join(ROOT, "src", "data", "catalog", "catalog.json"), "utf8")
  );
  // Nur echte Bau-Sets ansteuern (spart Rate-Limit): keine Rebrickable-
  // Platzhalter und keine Eintraege ohne Teile (Buecher/Gear/Rucksaecke, p=0).
  const ids = [];
  const idSet = new Set();
  for (const s of raw.sets) {
    if (!s.n || s.n.startsWith("DATABASE-")) continue;
    if (!s.p || s.p <= 0) continue;
    ids.push(s.n);
    idSet.add(s.n);
  }
  return { ids, idSet };
}

/** Kuratierte Set-IDs aus src/data/sets.ts (nur Basisnummern) auslesen. */
function loadCuratedBaseIds() {
  try {
    const text = readFileSync(join(ROOT, "src", "data", "sets.ts"), "utf8");
    return [...text.matchAll(/id:\s*["']([^"']+)["']/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

/** Basisnummer -> Katalog-ID (bevorzugt "-1", sonst erste Variante im Katalog). */
function toCatalogId(baseId, idSet) {
  if (idSet.has(baseId)) return baseId; // schon volle Form
  if (idSet.has(`${baseId}-1`)) return `${baseId}-1`;
  for (let v = 2; v <= 30; v++) {
    if (idSet.has(`${baseId}-${v}`)) return `${baseId}-${v}`;
  }
  return null;
}

/** Baut die priorisierte, deduplizierte Set-Liste. */
async function buildPriorityList(supabase, idSet, catalogIds) {
  const ordered = [];
  const seen = new Set();
  const push = (id) => {
    if (id && idSet.has(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  };

  // 1) Kuratierte Sets zuerst.
  for (const base of loadCuratedBaseIds()) push(toCatalogId(base, idSet));

  // 2) Meistgesehene Sets (falls set_views abfragbar).
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("set_views")
        .select("set_id, views")
        .order("views", { ascending: false })
        .limit(2000);
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const norm = /-\d+$/.test(row.set_id) ? row.set_id : `${row.set_id}-1`;
          if (idSet.has(norm)) push(norm);
          else push(toCatalogId(String(row.set_id).replace(/-\d+$/, ""), idSet));
        }
      }
    } catch {
      // set_views evtl. nicht vorhanden - ignorieren
    }
  }

  // 3) Rest in Katalogreihenfolge (bereits nach Jahr absteigend sortiert).
  for (const id of catalogIds) push(id);

  return ordered;
}

// --------------------------------------------------------------------------
// Supabase-Helfer
// --------------------------------------------------------------------------
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function isMissingTableError(error) {
  if (!error) return false;
  const msg = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache")
  );
}

/** set_id -> updated_at (ms) fuer die Frische-Pruefung. */
async function loadFreshness(supabase) {
  const map = new Map();
  if (!supabase) return { map, tableMissing: false };
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("set_prices")
      .select("set_id, updated_at")
      .range(from, from + pageSize - 1);
    if (error) {
      if (isMissingTableError(error)) return { map, tableMissing: true };
      throw error;
    }
    if (!data || data.length === 0) break;
    for (const row of data) map.set(row.set_id, Date.parse(row.updated_at));
    if (data.length < pageSize) break;
  }
  return { map, tableMissing: false };
}

async function readCursor(supabase) {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from("sync_state")
    .select("value")
    .eq("key", "bricklink_cursor")
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return 0;
    return 0;
  }
  const n = Number(data?.value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

async function writeCursor(supabase, value) {
  if (!supabase) return;
  await supabase
    .from("sync_state")
    .upsert({ key: "bricklink_cursor", value: String(value) }, { onConflict: "key" });
}

// --------------------------------------------------------------------------
// Hauptlauf
// --------------------------------------------------------------------------
async function main() {
  const creds = credentials();
  if (!creds) {
    console.error(
      "[bricklink] FEHLER: BrickLink-Zugangsdaten fehlen (BRICKLINK_CONSUMER_KEY/SECRET, BRICKLINK_TOKEN/SECRET)."
    );
    process.exit(1);
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.warn(
      "[bricklink] Warnung: Supabase nicht konfiguriert (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) - es wird nur abgefragt, kein Upsert."
    );
  }

  const { ids: catalogIds, idSet } = loadCatalogIds();

  // Ziel-Setliste bestimmen.
  let workList;
  let startIndex = 0;
  if (ARGS.sets) {
    workList = ARGS.sets;
    console.log(`[bricklink] Dry-Run: ${workList.length} explizit angegebene Sets.`);
  } else {
    const priority = await buildPriorityList(supabase, idSet, catalogIds);
    if (ARGS.limit) {
      workList = priority.slice(0, ARGS.limit);
      console.log(`[bricklink] Dry-Run: erste ${workList.length} Sets der Prioritaetsliste.`);
    } else {
      workList = priority;
      startIndex = (await readCursor(supabase)) % Math.max(1, priority.length);
      console.log(
        `[bricklink] Voller Lauf: ${priority.length} Sets in Prioritaetsliste, Cursor bei Index ${startIndex}.`
      );
    }
  }

  // Frische-Map laden (nur relevant fuer den vollen Lauf).
  let freshMap = new Map();
  let tableMissing = false;
  if (!DRY_RUN && supabase) {
    try {
      const fr = await loadFreshness(supabase);
      freshMap = fr.map;
      tableMissing = fr.tableMissing;
      if (tableMissing) {
        console.error(
          "[bricklink] Tabelle set_prices fehlt - Betreiber muss Schema deployen (supabase/schema.sql). Lauf wird abgebrochen."
        );
        process.exit(0);
      }
    } catch (err) {
      console.warn(`[bricklink] Frische-Pruefung uebersprungen: ${err?.message ?? err}`);
    }
  }

  const N = workList.length;
  const maxFetch = DRY_RUN ? N : Math.min(MAX_SETS_PER_RUN, N);
  const nowMs = Date.now();

  let examined = 0;
  let fetched = 0;
  let updated = 0;
  let noData = 0;
  let skippedFresh = 0;
  let errors = 0;
  let idx = DRY_RUN ? 0 : startIndex;

  while (examined < N && fetched < maxFetch) {
    const setNo = workList[idx];
    examined++;
    const nextIdx = (idx + 1) % N;

    // Frische-Skip nur im vollen Lauf.
    if (!DRY_RUN) {
      const ts = freshMap.get(setNo);
      if (ts && nowMs - ts < FRESH_DAYS * 86_400_000) {
        skippedFresh++;
        idx = nextIdx;
        continue;
      }
    }

    let stop = false;
    try {
      const nw = await getSetPrice(creds, setNo, "N");
      await sleep(PACING_MS);
      const us = await getSetPrice(creds, setNo, "U");
      await sleep(PACING_MS);
      fetched++;

      if (nw.avgEUR === null && us.avgEUR === null) noData++;

      if (DRY_RUN) {
        const fmt = (p) => (p.avgEUR === null ? "keine Daten" : `${p.avgEUR.toFixed(2)} EUR (${p.qty} Verk.)`);
        console.log(`  ${setNo.padEnd(14)} neu: ${fmt(nw).padEnd(28)} gebraucht: ${fmt(us)}`);
      }

      if (supabase && !tableMissing) {
        const { error } = await supabase.from("set_prices").upsert(
          {
            set_id: setNo,
            new_eur: nw.avgEUR,
            used_eur: us.avgEUR,
            new_qty: nw.qty,
            used_qty: us.qty,
            currency: "EUR",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "set_id" }
        );
        if (error) {
          if (isMissingTableError(error)) {
            tableMissing = true;
            console.error(
              "[bricklink] Tabelle set_prices fehlt - Betreiber muss Schema deployen (supabase/schema.sql). Fetch-Werte werden weiter ausgegeben."
            );
            if (!DRY_RUN) stop = true; // im vollen Lauf kein Sinn weiterzumachen
          } else {
            errors++;
            console.warn(`  ! Upsert-Fehler bei ${setNo}: ${error.message}`);
          }
        } else if (nw.avgEUR !== null || us.avgEUR !== null) {
          updated++;
        }
      }
    } catch (err) {
      errors++;
      const status = err?.status;
      console.warn(`  ! Fehler bei ${setNo}: ${err?.message ?? err}`);
      if (status === 429) {
        console.warn("[bricklink] Rate-Limit (429) erreicht - Lauf wird beendet.");
        stop = true;
      }
    }

    idx = nextIdx;
    if (stop) break;
  }

  // Cursor fortschreiben (nur voller Lauf, Tabelle vorhanden).
  if (!DRY_RUN && supabase && !tableMissing) {
    const wrapped = examined >= N; // Liste komplett durchlaufen -> zurueck auf 0
    const newCursor = wrapped ? 0 : idx;
    await writeCursor(supabase, newCursor);
    console.log(`[bricklink] Cursor neu gesetzt auf Index ${newCursor}${wrapped ? " (Liste komplett - Neustart)" : ""}.`);
  }

  console.log("[bricklink] ------------------------------------------------");
  console.log(`[bricklink] Zusammenfassung${DRY_RUN ? " (Dry-Run)" : ""}:`);
  console.log(`  geprueft:        ${examined}`);
  console.log(`  abgefragt (API): ${fetched} Sets (${fetched * 2} Calls)`);
  console.log(`  aktualisiert:    ${updated}`);
  console.log(`  ohne Preisguide: ${noData}`);
  console.log(`  frisch (skip):   ${skippedFresh}`);
  console.log(`  Fehler:          ${errors}`);
  if (tableMissing) {
    console.log("[bricklink] HINWEIS: set_prices fehlt noch - nach Schema-Deploy laeuft der Upsert.");
  }
}

main().catch((err) => {
  console.error(`[bricklink] Abbruch: ${err?.message ?? err}`);
  process.exit(1);
});
