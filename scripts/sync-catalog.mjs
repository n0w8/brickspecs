#!/usr/bin/env node
/**
 * Bricktopia Katalog-Sync-Agent
 *
 * Lädt den kompletten LEGO-Set-Katalog von Rebrickable (offizielle, täglich
 * aktualisierte CSV-Dumps, kein API-Key nötig) und schreibt ihn nach
 * src/data/catalog/. Erkennt neue Sets gegenüber dem letzten Lauf.
 *
 * Aufruf:  node scripts/sync-catalog.mjs
 * Automatisierung: täglich per Scheduled Task / Cron ("npm run sync-catalog").
 */

import { gunzipSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "src", "data", "catalog");

const SETS_URL = "https://cdn.rebrickable.com/media/downloads/sets.csv.gz";
const THEMES_URL = "https://cdn.rebrickable.com/media/downloads/themes.csv.gz";

/** Einfacher CSV-Parser mit Quote-Unterstützung (Namen enthalten Kommas). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download fehlgeschlagen (${res.status}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return gunzipSync(buf).toString("utf8");
}

console.log("[sync-catalog] Lade Rebrickable-Dumps …");
const [setsCsv, themesCsv] = await Promise.all([download(SETS_URL), download(THEMES_URL)]);

// themes.csv: id,name,parent_id
const themeRows = parseCsv(themesCsv);
const themes = {};
for (const r of themeRows.slice(1)) {
  if (r.length < 2 || !r[0]) continue;
  themes[r[0]] = { name: r[1], parent: r[2] || null };
}

// sets.csv: set_num,name,year,theme_id,num_parts,img_url
const setRows = parseCsv(setsCsv);
const header = setRows[0];
const idx = {
  set_num: header.indexOf("set_num"),
  name: header.indexOf("name"),
  year: header.indexOf("year"),
  theme_id: header.indexOf("theme_id"),
  num_parts: header.indexOf("num_parts"),
  img_url: header.indexOf("img_url"),
};
if (idx.set_num < 0 || idx.name < 0) {
  throw new Error(`Unerwartetes CSV-Format: ${header.join(",")}`);
}

const sets = [];
for (const r of setRows.slice(1)) {
  if (!r[idx.set_num]) continue;
  sets.push({
    n: r[idx.set_num],
    t: r[idx.name],
    y: Number(r[idx.year]) || 0,
    th: r[idx.theme_id],
    p: Number(r[idx.num_parts]) || 0,
    i: idx.img_url >= 0 ? r[idx.img_url] : "",
  });
}
sets.sort((a, b) => b.y - a.y || a.n.localeCompare(b.n));

// Neue Sets gegenüber letztem Lauf erkennen
let newSets = [];
const catalogPath = join(OUT_DIR, "catalog.json");
if (existsSync(catalogPath)) {
  try {
    const prev = JSON.parse(readFileSync(catalogPath, "utf8"));
    const prevIds = new Set(prev.sets.map((s) => s.n));
    newSets = sets.filter((s) => !prevIds.has(s.n));
  } catch {
    // korrupte Vorversion — kompletter Neuimport
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(catalogPath, JSON.stringify({ fetchedAt: new Date().toISOString(), sets }));
writeFileSync(join(OUT_DIR, "themes.json"), JSON.stringify(themes));
writeFileSync(
  join(OUT_DIR, "meta.json"),
  JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      totalSets: sets.length,
      totalThemes: Object.keys(themes).length,
      newSetsLastRun: newSets.map((s) => ({ id: s.n, name: s.t, year: s.y })),
    },
    null,
    2
  )
);

console.log(`[sync-catalog] ${sets.length} Sets, ${Object.keys(themes).length} Themes gespeichert.`);
if (newSets.length > 0) {
  console.log(`[sync-catalog] ${newSets.length} NEUE Sets seit letztem Lauf:`);
  for (const s of newSets.slice(0, 20)) console.log(`  + ${s.n} — ${s.t} (${s.y})`);
  if (newSets.length > 20) console.log(`  … und ${newSets.length - 20} weitere (siehe meta.json)`);
} else {
  console.log("[sync-catalog] Keine neuen Sets seit letztem Lauf.");
}

// Deutsche Katalognamen für den frischen Dump neu erzeugen (names-de.json).
// Bewusst non-fatal: schlägt die Übersetzung fehl, bleibt der Sync gültig -
// die App fällt dann einfach auf die (ggf. ältere) names-de.json zurück.
try {
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, [join(ROOT, "scripts", "generate-names-de.mjs")], {
    stdio: "inherit",
  });
} catch (err) {
  console.warn(
    `[sync-catalog] Warnung: generate-names-de.mjs fehlgeschlagen (nicht kritisch): ${
      err?.message ?? err
    }`
  );
}
