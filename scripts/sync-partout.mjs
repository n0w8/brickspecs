#!/usr/bin/env node
/**
 * BrickSpecs Part-Out-Value-Sync (Teilewert)
 *
 * Berechnet je Set den Teilewert = Summe der Einzelpreise aller Teile UND
 * Minifiguren (getrennt nach neu/gebraucht). Quelle ist die BrickLink
 * Price-Guide-API mit guide_type=stock (aktueller Angebots-Durchschnitt, nicht
 * "sold" - Einzelteile werden selten als "sold" gefuehrt). Das Set-Inventar
 * kommt aus /items/SET/{no}/subsets.
 *
 * Weil Sets sich sehr viele Teile teilen, werden alle Teilepreise in
 * public.part_prices gecacht (Frische 30 Tage). Dadurch amortisiert sich das
 * harte API-Call-Budget ueber mehrere Tageslaeufe hinweg: was ein Set an
 * Teilen "bezahlt", steht dem naechsten Set gratis zur Verfuegung.
 *
 * Prioritaet: kuratierte Sets zuerst, dann meistgesehene (set_views), dann
 * bereits bepreiste Sets (set_prices). Ein rollierender Cursor
 * (sync_state key "partout_cursor") setzt ueber Tage fort.
 *
 * Aufruf (voller Lauf):   node scripts/sync-partout.mjs
 * Budget setzen:          node scripts/sync-partout.mjs --budget 3000
 * Test einzelner Sets:    node scripts/sync-partout.mjs --sets 6552-1 --budget 400
 * Test erste N Sets:      node scripts/sync-partout.mjs --limit 5 --budget 800
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
const DEFAULT_BUDGET = 3000; // harte Obergrenze an API-Calls pro Lauf
const FRESH_DAYS = 30; // Cache/Set gilt 30 Tage als aktuell
const FRESH_MS = FRESH_DAYS * 86_400_000;
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
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
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
  const args = { limit: null, sets: null, budget: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") args.limit = Math.max(1, Number(argv[++i]) || 1);
    else if (argv[i] === "--budget") args.budget = Math.max(1, Number(argv[++i]) || 1);
    else if (argv[i] === "--sets")
      args.sets = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (/-\d+$/.test(s) ? s : `${s}-1`));
  }
  return args;
}
const ARGS = parseArgs(process.argv.slice(2));
const DRY_RUN = ARGS.limit !== null || ARGS.sets !== null;
const BUDGET = ARGS.budget ?? DEFAULT_BUDGET;

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

/** Signierter GET. 404 (HTTP/meta) -> { code:404, data:null }. Sonst wirft er. */
async function blSignedGet(creds, urlWithoutQuery, query) {
  const authHeader = buildAuthHeader(creds, urlWithoutQuery, query);
  const qs = Object.entries(query)
    .map(([k, v]) => `${pctEnc(k)}=${pctEnc(v)}`)
    .join("&");
  const url = qs ? `${urlWithoutQuery}?${qs}` : urlWithoutQuery;

  let res;
  try {
    res = await fetch(url, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const e = new Error(`Netzwerk/Timeout: ${err?.message ?? err}`);
    e.status = 0;
    throw e;
  }

  if (res.status === 404) return { code: 404, data: null };
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
  if (code === 404) return { code: 404, data: null };
  if (code !== 200) {
    const detail = json?.meta?.description ?? json?.meta?.message ?? "Fehler";
    const e = new Error(`meta ${code ?? res.status}: ${detail}`);
    e.status = res.status || 500;
    throw e;
  }
  return { code: 200, data: json.data ?? null };
}

function parsePrice(data) {
  if (!data) return { avgEUR: null, qty: 0 };
  const rawAvg = data.avg_price;
  const avg = rawAvg !== undefined && rawAvg !== "" ? Number(rawAvg) : NaN;
  const avgEUR = Number.isFinite(avg) && avg > 0 ? avg : null;
  const rawQty = data.unit_quantity ?? data.total_quantity ?? 0;
  const qtyNum = Number(rawQty);
  const qty = Number.isFinite(qtyNum) && qtyNum > 0 ? Math.round(qtyNum) : 0;
  return { avgEUR, qty };
}

async function getPartPrice(creds, partNo, colorId, newOrUsed) {
  const url = `${BASE_URL}/items/PART/${encodeURIComponent(partNo)}/price`;
  const query = {
    guide_type: "stock",
    new_or_used: newOrUsed,
    color_id: String(colorId),
    currency_code: "EUR",
  };
  const { data } = await blSignedGet(creds, url, query);
  return parsePrice(data);
}

async function getMinifigPrice(creds, minifigNo, newOrUsed) {
  const url = `${BASE_URL}/items/MINIFIG/${encodeURIComponent(minifigNo)}/price`;
  const query = { guide_type: "stock", new_or_used: newOrUsed, currency_code: "EUR" };
  const { data } = await blSignedGet(creds, url, query);
  return parsePrice(data);
}

/** Set-Inventar -> [{ itemType, no, colorId, qty }], Alternativen/Gegenstuecke raus. */
async function getSetSubsets(creds, setNo) {
  const url = `${BASE_URL}/items/SET/${encodeURIComponent(setNo)}/subsets`;
  const { data } = await blSignedGet(creds, url, {});
  if (!Array.isArray(data)) return [];
  const agg = new Map();
  for (const group of data) {
    const entries = Array.isArray(group?.entries) ? group.entries : [];
    for (const e of entries) {
      if (e?.is_alternate || e?.is_counterpart) continue;
      const type = e?.item?.type;
      if (type !== "PART" && type !== "MINIFIG") continue;
      const no = e?.item?.no;
      if (!no) continue;
      const colorId = Number(e?.color_id ?? 0) || 0;
      const qty = Number(e?.quantity ?? 0) || 0;
      if (qty <= 0) continue;
      const key = `${type}|${no}|${colorId}`;
      const prev = agg.get(key);
      if (prev) prev.qty += qty;
      else agg.set(key, { itemType: type, no, colorId, qty });
    }
  }
  return [...agg.values()];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round2 = (n) => Math.round(n * 100) / 100;
function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

// --------------------------------------------------------------------------
// Katalog + Prioritaetsliste
// --------------------------------------------------------------------------
function loadCatalogIdSet() {
  try {
    const raw = JSON.parse(
      readFileSync(join(ROOT, "src", "data", "catalog", "catalog.json"), "utf8")
    );
    const idSet = new Set();
    for (const s of raw.sets) {
      if (!s.n || s.n.startsWith("DATABASE-")) continue;
      idSet.add(s.n);
    }
    return idSet;
  } catch {
    return new Set();
  }
}

function loadCuratedBaseIds() {
  try {
    const text = readFileSync(join(ROOT, "src", "data", "sets.ts"), "utf8");
    return [...text.matchAll(/id:\s*["']([^"']+)["']/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

function toCatalogId(baseId, idSet) {
  if (idSet.has(baseId)) return baseId;
  if (idSet.has(`${baseId}-1`)) return `${baseId}-1`;
  for (let v = 2; v <= 30; v++) {
    if (idSet.has(`${baseId}-${v}`)) return `${baseId}-${v}`;
  }
  return null;
}

/** Kuratiert -> meistgesehen -> bereits bepreist. KEIN voller Katalog (Budget). */
async function buildPriorityList(supabase, idSet) {
  const ordered = [];
  const seen = new Set();
  const push = (id) => {
    if (id && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  };

  // 1) Kuratierte Sets zuerst.
  for (const base of loadCuratedBaseIds()) {
    push(toCatalogId(base, idSet) ?? (/-\d+$/.test(base) ? base : `${base}-1`));
  }

  if (supabase) {
    // 2) Meistgesehene Sets.
    try {
      const { data, error } = await supabase
        .from("set_views")
        .select("set_id, views")
        .order("views", { ascending: false })
        .limit(3000);
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          push(/-\d+$/.test(row.set_id) ? row.set_id : `${row.set_id}-1`);
        }
      }
    } catch {
      /* set_views evtl. nicht vorhanden */
    }

    // 3) Sets, die schon einen (Sold-)Preis haben.
    try {
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from("set_prices")
          .select("set_id")
          .range(from, from + pageSize - 1);
        if (error || !data || data.length === 0) break;
        for (const row of data) push(row.set_id);
        if (data.length < pageSize) break;
      }
    } catch {
      /* set_prices evtl. nicht vorhanden */
    }
  }

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
    msg.includes("could not find the table") ||
    msg.includes("schema cache")
  );
}

function isMissingColumnError(error) {
  if (!error) return false;
  const msg = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    (msg.includes("column") && msg.includes("does not exist")) ||
    (msg.includes("could not find the") && msg.includes("column"))
  );
}

/** Frischer Teilepreis-Cache (nur Eintraege juenger als 30 Tage). */
async function loadPartCache(supabase) {
  const map = new Map();
  if (!supabase) return { map, missing: false };
  const cutoff = new Date(Date.now() - FRESH_MS).toISOString();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("part_prices")
      .select("part_type, part_no, color_id, new_eur, used_eur, updated_at")
      .gte("updated_at", cutoff)
      .range(from, from + pageSize - 1);
    if (error) {
      if (isMissingTableError(error)) return { map, missing: true };
      throw error;
    }
    if (!data || data.length === 0) break;
    for (const r of data) {
      map.set(`${r.part_type}|${r.part_no}|${r.color_id}`, {
        newEUR: toNum(r.new_eur),
        usedEUR: toNum(r.used_eur),
        ts: Date.parse(r.updated_at),
      });
    }
    if (data.length < pageSize) break;
  }
  return { map, missing: false };
}

/** set_id -> part_out_updated_at (ms) fuer die Frische-Pruefung im vollen Lauf. */
async function loadPartOutFreshness(supabase) {
  const map = new Map();
  if (!supabase) return map;
  try {
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("set_prices")
        .select("set_id, part_out_updated_at")
        .range(from, from + pageSize - 1);
      if (error) return map; // Spalte evtl. noch nicht deployt -> keine Frische-Info
      if (!data || data.length === 0) break;
      for (const r of data) {
        if (r.part_out_updated_at) map.set(r.set_id, Date.parse(r.part_out_updated_at));
      }
      if (data.length < pageSize) break;
    }
  } catch {
    /* egal - Frische ist nur Optimierung */
  }
  return map;
}

async function readCursor(supabase) {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from("sync_state")
    .select("value")
    .eq("key", "partout_cursor")
    .maybeSingle();
  if (error) return 0;
  const n = Number(data?.value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

async function writeCursor(supabase, value) {
  if (!supabase) return;
  await supabase
    .from("sync_state")
    .upsert({ key: "partout_cursor", value: String(value) }, { onConflict: "key" });
}

// --------------------------------------------------------------------------
// Hauptlauf
// --------------------------------------------------------------------------
async function main() {
  const creds = credentials();
  if (!creds) {
    console.error(
      "[partout] FEHLER: BrickLink-Zugangsdaten fehlen (BRICKLINK_CONSUMER_KEY/SECRET, BRICKLINK_TOKEN/SECRET)."
    );
    process.exit(1);
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.warn(
      "[partout] Warnung: Supabase nicht konfiguriert - es wird nur berechnet, kein Cache/Upsert."
    );
  }

  const idSet = loadCatalogIdSet();

  // Ziel-Setliste bestimmen.
  let workList;
  let startIndex = 0;
  if (ARGS.sets) {
    workList = ARGS.sets;
    console.log(`[partout] Test: ${workList.length} explizit angegebene Sets. Budget ${BUDGET} Calls.`);
  } else {
    const priority = await buildPriorityList(supabase, idSet);
    if (ARGS.limit) {
      workList = priority.slice(0, ARGS.limit);
      console.log(`[partout] Test: erste ${workList.length} Sets der Prioritaetsliste. Budget ${BUDGET} Calls.`);
    } else {
      workList = priority;
      startIndex = priority.length ? (await readCursor(supabase)) % priority.length : 0;
      console.log(
        `[partout] Voller Lauf: ${priority.length} Sets in Prioritaetsliste, Cursor bei Index ${startIndex}. Budget ${BUDGET} Calls.`
      );
    }
  }

  if (workList.length === 0) {
    console.log("[partout] Keine Sets in der Arbeitsliste - nichts zu tun.");
    return;
  }

  // Cache + Frische laden.
  let cacheMap = new Map();
  let partPricesMissing = false;
  try {
    const c = await loadPartCache(supabase);
    cacheMap = c.map;
    partPricesMissing = c.missing;
    if (partPricesMissing) {
      console.error(
        "[partout] Tabelle part_prices fehlt - Betreiber muss Schema deployen (supabase/schema.sql). Ohne Cache: jeder Teilepreis wird frisch geholt."
      );
    } else {
      console.log(`[partout] Teilepreis-Cache geladen: ${cacheMap.size} frische Eintraege (< ${FRESH_DAYS} Tage).`);
    }
  } catch (err) {
    console.warn(`[partout] Cache-Laden uebersprungen: ${err?.message ?? err}`);
  }

  let freshMap = new Map();
  if (!DRY_RUN) freshMap = await loadPartOutFreshness(supabase);

  const N = workList.length;
  const nowMs = Date.now();

  let callsUsed = 0;
  let setsProcessed = 0; // vollstaendig berechnet
  let setsWritten = 0; // in set_prices geschrieben
  let cacheHits = 0; // Teile aus Cache
  let newFetches = 0; // Teile frisch geholt (je 2 Calls)
  let noInventory = 0;
  let skippedFresh = 0;
  let partErrors = 0;
  let setErrors = 0;
  let budgetHit = false;
  let rateLimited = false;
  let setWriteDisabled = false;

  let idx = startIndex;
  let examined = 0;

  while (examined < N) {
    if (callsUsed >= BUDGET) {
      budgetHit = true;
      break;
    }
    const setNo = workList[idx];
    const nextIdx = (idx + 1) % N;

    // Frische-Skip nur im vollen Lauf.
    if (!DRY_RUN) {
      const ts = freshMap.get(setNo);
      if (ts && nowMs - ts < FRESH_MS) {
        skippedFresh++;
        examined++;
        idx = nextIdx;
        continue;
      }
    }
    examined++;

    // Inventar holen.
    let subs;
    try {
      subs = await getSetSubsets(creds, setNo);
      callsUsed++;
      await sleep(PACING_MS);
    } catch (err) {
      setErrors++;
      console.warn(`  ! Inventar-Fehler bei ${setNo}: ${err?.message ?? err}`);
      if (err?.status === 429) {
        console.warn("[partout] Rate-Limit (429) - Lauf wird beendet.");
        rateLimited = true;
        break;
      }
      idx = nextIdx;
      continue;
    }

    if (subs.length === 0) {
      noInventory++;
      if (DRY_RUN) console.log(`  ${setNo.padEnd(14)} kein Inventar (keine Teile-/Figur-Daten)`);
      idx = nextIdx;
      continue;
    }

    // Teile bepreisen.
    let sumNew = 0;
    let sumUsed = 0;
    let totalQty = 0;
    let coveredNewQty = 0;
    let coveredUsedQty = 0;
    let incomplete = false;

    for (const it of subs) {
      const cacheColor = it.itemType === "MINIFIG" ? -1 : it.colorId;
      const key = `${it.itemType}|${it.no}|${cacheColor}`;
      let priceNew = null;
      let priceUsed = null;

      const cached = cacheMap.get(key);
      if (cached && nowMs - cached.ts < FRESH_MS) {
        priceNew = cached.newEUR;
        priceUsed = cached.usedEUR;
        cacheHits++;
      } else {
        if (callsUsed + 2 > BUDGET) {
          incomplete = true;
          break;
        }
        try {
          const nw =
            it.itemType === "MINIFIG"
              ? await getMinifigPrice(creds, it.no, "N")
              : await getPartPrice(creds, it.no, it.colorId, "N");
          callsUsed++;
          await sleep(PACING_MS);
          const us =
            it.itemType === "MINIFIG"
              ? await getMinifigPrice(creds, it.no, "U")
              : await getPartPrice(creds, it.no, it.colorId, "U");
          callsUsed++;
          await sleep(PACING_MS);

          priceNew = nw.avgEUR;
          priceUsed = us.avgEUR;
          newFetches++;
          cacheMap.set(key, { newEUR: priceNew, usedEUR: priceUsed, ts: nowMs });

          if (supabase && !partPricesMissing) {
            const { error } = await supabase.from("part_prices").upsert(
              {
                part_type: it.itemType,
                part_no: it.no,
                color_id: cacheColor,
                new_eur: priceNew,
                used_eur: priceUsed,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "part_type,part_no,color_id" }
            );
            if (error) {
              if (isMissingTableError(error)) {
                partPricesMissing = true;
                console.error(
                  "[partout] Tabelle part_prices fehlt - Betreiber muss Schema deployen. Cache-Schreiben deaktiviert, Berechnung laeuft weiter."
                );
              } else {
                console.warn(`  ! part_prices-Upsert-Fehler ${it.no}: ${error.message}`);
              }
            }
          }
        } catch (err) {
          if (err?.status === 429) {
            console.warn("[partout] Rate-Limit (429) - Lauf wird beendet.");
            rateLimited = true;
            incomplete = true;
            break;
          }
          // Einzelner Teil-Fehler -> als "kein Preis" behandeln, weitermachen.
          partErrors++;
        }
      }

      totalQty += it.qty;
      if (priceNew != null) {
        sumNew += priceNew * it.qty;
        coveredNewQty += it.qty;
      }
      if (priceUsed != null) {
        sumUsed += priceUsed * it.qty;
        coveredUsedQty += it.qty;
      }
    }

    if (incomplete) {
      // Budget/Rate mitten im Set erschoepft: Set NICHT schreiben, Cursor bleibt
      // hier stehen. Die bereits gecachten Teile machen den naechsten Lauf billiger.
      budgetHit = budgetHit || !rateLimited;
      break;
    }

    const partOutNew = coveredNewQty > 0 ? round2(sumNew) : null;
    const partOutUsed = coveredUsedQty > 0 ? round2(sumUsed) : null;
    const covNew = totalQty > 0 ? Math.round((coveredNewQty / totalQty) * 100) : 0;
    const covUsed = totalQty > 0 ? Math.round((coveredUsedQty / totalQty) * 100) : 0;

    if (DRY_RUN) {
      const fN = partOutNew === null ? "keine Daten" : `${partOutNew.toFixed(2)} EUR`;
      const fU = partOutUsed === null ? "keine Daten" : `${partOutUsed.toFixed(2)} EUR`;
      console.log(
        `  ${setNo.padEnd(14)} Teilewert neu: ${fN.padEnd(16)} gebraucht: ${fU.padEnd(16)} ` +
          `(${subs.length} Sorten, Abdeckung neu ${covNew}% / gebr. ${covUsed}%)`
      );
    }

    if (supabase && !setWriteDisabled) {
      const { error } = await supabase.from("set_prices").upsert(
        {
          set_id: setNo,
          part_out_new_eur: partOutNew,
          part_out_used_eur: partOutUsed,
          part_out_updated_at: new Date().toISOString(),
        },
        { onConflict: "set_id" }
      );
      if (error) {
        if (isMissingColumnError(error) || isMissingTableError(error)) {
          setWriteDisabled = true;
          console.error(
            "[partout] Schema fehlt (set_prices Part-Out-Spalten oder Tabelle) - Betreiber muss deployen. Werte werden weiter berechnet und ausgegeben, aber nicht gespeichert."
          );
        } else {
          setErrors++;
          console.warn(`  ! set_prices-Upsert-Fehler ${setNo}: ${error.message}`);
        }
      } else {
        setsWritten++;
      }
    }

    setsProcessed++;
    idx = nextIdx;
  }

  // Cursor fortschreiben (nur voller Lauf).
  if (!DRY_RUN && supabase) {
    const wrapped = examined >= N && !budgetHit && !rateLimited;
    const newCursor = wrapped ? 0 : idx;
    await writeCursor(supabase, newCursor);
    console.log(
      `[partout] Cursor neu gesetzt auf Index ${newCursor}${wrapped ? " (Liste komplett - Neustart)" : ""}.`
    );
  }

  console.log("[partout] ------------------------------------------------");
  console.log(`[partout] Zusammenfassung${DRY_RUN ? " (Test)" : ""}:`);
  console.log(`  Sets berechnet:      ${setsProcessed}`);
  console.log(`  Sets gespeichert:    ${setsWritten}`);
  console.log(`  Sets ohne Inventar:  ${noInventory}`);
  console.log(`  Sets frisch (skip):  ${skippedFresh}`);
  console.log(`  Teile-Cache-Treffer: ${cacheHits}`);
  console.log(`  Teile frisch geholt: ${newFetches} (je 2 Calls)`);
  console.log(`  API-Calls gesamt:    ${callsUsed} / Budget ${BUDGET}`);
  console.log(`  Teil-Fehler:         ${partErrors}`);
  console.log(`  Set-Fehler:          ${setErrors}`);
  if (budgetHit) console.log("[partout] HINWEIS: Budget erschoepft - Cursor gemerkt, naechster Lauf setzt fort (Cache hilft).");
  if (rateLimited) console.log("[partout] HINWEIS: Durch Rate-Limit (429) beendet.");
  if (partPricesMissing || setWriteDisabled) {
    console.log(
      "[partout] HINWEIS: Schema fehlt (part_prices und/oder set_prices Part-Out-Spalten). Betreiber muss supabase/schema.sql deployen."
    );
  }
}

main().catch((err) => {
  console.error(`[partout] Abbruch: ${err?.message ?? err}`);
  process.exit(1);
});
