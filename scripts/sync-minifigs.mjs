#!/usr/bin/env node
/**
 * Bricktopia Minifiguren-Sync-Agent
 *
 * Lädt den kompletten LEGO-Minifiguren-Katalog von Rebrickable (offizielle,
 * täglich aktualisierte CSV-Dumps, kein API-Key nötig) und schreibt ihn nach
 * src/data/catalog/. Verknüpft jede Figur über inventory_minifigs → inventories
 * mit den Sets, in denen sie vorkommt. Erkennt neue Figuren gegenüber dem
 * letzten Lauf.
 *
 * Aufruf:  node scripts/sync-minifigs.mjs
 * Automatisierung: täglich per Scheduled Task / Cron ("npm run sync-minifigs").
 */

import { gunzipSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "src", "data", "catalog");

const MINIFIGS_URL = "https://cdn.rebrickable.com/media/downloads/minifigs.csv.gz";
const INVENTORIES_URL = "https://cdn.rebrickable.com/media/downloads/inventories.csv.gz";
const INVENTORY_MINIFIGS_URL =
  "https://cdn.rebrickable.com/media/downloads/inventory_minifigs.csv.gz";

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

console.log("[sync-minifigs] Lade Rebrickable-Dumps …");
const [minifigsCsv, inventoriesCsv, invMinifigsCsv] = await Promise.all([
  download(MINIFIGS_URL),
  download(INVENTORIES_URL),
  download(INVENTORY_MINIFIGS_URL),
]);

// minifigs.csv: fig_num,name,num_parts,img_url
const figRows = parseCsv(minifigsCsv);
const figHeader = figRows[0];
const fIdx = {
  fig_num: figHeader.indexOf("fig_num"),
  name: figHeader.indexOf("name"),
  num_parts: figHeader.indexOf("num_parts"),
  img_url: figHeader.indexOf("img_url"),
};
if (fIdx.fig_num < 0 || fIdx.name < 0) {
  throw new Error(`Unerwartetes minifigs.csv-Format: ${figHeader.join(",")}`);
}

// inventories.csv: id,version,set_num → Inventar-ID → Setnummer
const invRows = parseCsv(inventoriesCsv);
const invHeader = invRows[0];
const iIdx = {
  id: invHeader.indexOf("id"),
  set_num: invHeader.indexOf("set_num"),
};
if (iIdx.id < 0 || iIdx.set_num < 0) {
  throw new Error(`Unerwartetes inventories.csv-Format: ${invHeader.join(",")}`);
}
const setByInventory = new Map();
for (const r of invRows.slice(1)) {
  if (!r[iIdx.id]) continue;
  setByInventory.set(r[iIdx.id], r[iIdx.set_num]);
}

// inventory_minifigs.csv: inventory_id,fig_num,quantity → Figur → Sets (dedupliziert)
const imRows = parseCsv(invMinifigsCsv);
const imHeader = imRows[0];
const mIdx = {
  inventory_id: imHeader.indexOf("inventory_id"),
  fig_num: imHeader.indexOf("fig_num"),
};
if (mIdx.inventory_id < 0 || mIdx.fig_num < 0) {
  throw new Error(`Unerwartetes inventory_minifigs.csv-Format: ${imHeader.join(",")}`);
}
const setsByFig = new Map();
for (const r of imRows.slice(1)) {
  const figNum = r[mIdx.fig_num];
  if (!figNum) continue;
  const setNum = setByInventory.get(r[mIdx.inventory_id]);
  if (!setNum) continue;
  let set = setsByFig.get(figNum);
  if (!set) {
    set = new Set();
    setsByFig.set(figNum, set);
  }
  set.add(setNum);
}

const figs = [];
for (const r of figRows.slice(1)) {
  const figNum = r[fIdx.fig_num];
  if (!figNum) continue;
  figs.push({
    n: figNum,
    t: r[fIdx.name],
    p: Number(r[fIdx.num_parts]) || 0,
    i: fIdx.img_url >= 0 ? r[fIdx.img_url] : "",
    s: Array.from(setsByFig.get(figNum) ?? []).sort(),
  });
}
figs.sort((a, b) => a.n.localeCompare(b.n));

// Neue Figuren gegenüber letztem Lauf erkennen
let newFigs = [];
const catalogPath = join(OUT_DIR, "minifig-catalog.json");
if (existsSync(catalogPath)) {
  try {
    const prev = JSON.parse(readFileSync(catalogPath, "utf8"));
    const prevIds = new Set(prev.figs.map((f) => f.n));
    newFigs = figs.filter((f) => !prevIds.has(f.n));
  } catch {
    // korrupte Vorversion — kompletter Neuimport
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(catalogPath, JSON.stringify({ fetchedAt: new Date().toISOString(), figs }));
writeFileSync(
  join(OUT_DIR, "minifig-meta.json"),
  JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      totalFigs: figs.length,
      newFigsLastRun: newFigs.map((f) => ({ id: f.n, name: f.t })),
    },
    null,
    2
  )
);

const withSets = figs.filter((f) => f.s.length > 0).length;
console.log(
  `[sync-minifigs] ${figs.length} Figuren gespeichert (${withSets} mit Set-Zuordnung).`
);
if (newFigs.length > 0) {
  console.log(`[sync-minifigs] ${newFigs.length} NEUE Figuren seit letztem Lauf:`);
  for (const f of newFigs.slice(0, 20)) console.log(`  + ${f.n} — ${f.t}`);
  if (newFigs.length > 20)
    console.log(`  … und ${newFigs.length - 20} weitere (siehe minifig-meta.json)`);
} else {
  console.log("[sync-minifigs] Keine neuen Figuren seit letztem Lauf.");
}
