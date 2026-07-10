#!/usr/bin/env node
// catalog-audit.mjs
// Reines Node-Skript zur Bestandsaufnahme des Brickonaut-Katalogs.
// Liest src/data/catalog/catalog.json (und themes.json) und gibt einen
// lesbaren Report auf stdout aus. Aendert KEINE Daten.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(__dirname, '..', 'src', 'data', 'catalog', 'catalog.json');
const themesPath = join(__dirname, '..', 'src', 'data', 'catalog', 'themes.json');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const catalog = loadJson(catalogPath);
let themes = {};
try {
  themes = loadJson(themesPath);
} catch {
  themes = {};
}

const sets = Array.isArray(catalog.sets) ? catalog.sets : [];
const total = sets.length;

// --- Jahres-Verteilung ---
const byYear = new Map();
let noYear = 0;
let noImage = 0;
let noParts = 0;

for (const s of sets) {
  const y = Number(s.y) || 0;
  if (y === 0) noYear += 1;
  byYear.set(y, (byYear.get(y) || 0) + 1);

  const img = (s.i || '').trim();
  if (!img) noImage += 1;

  const p = Number(s.p) || 0;
  if (p === 0) noParts += 1;
}

const years = [...byYear.keys()].filter((y) => y > 0).sort((a, b) => a - b);
const minYear = years.length ? years[0] : 0;
const maxYear = years.length ? years[years.length - 1] : 0;

// --- Duplikate / Varianten (gleiche Basisnummer vor "-") ---
const baseMap = new Map();
for (const s of sets) {
  const num = String(s.n || '');
  const base = num.includes('-') ? num.slice(0, num.lastIndexOf('-')) : num;
  baseMap.set(base, (baseMap.get(base) || 0) + 1);
}
let basesWithMultiple = 0;
let variantSetsCount = 0; // Sets, die zu einer Basis mit >1 Varianten gehoeren
let maxVariants = 0;
let maxVariantsBase = '';
for (const [base, count] of baseMap) {
  if (count > 1) {
    basesWithMultiple += 1;
    variantSetsCount += count;
    if (count > maxVariants) {
      maxVariants = count;
      maxVariantsBase = base;
    }
  }
}
const uniqueBases = baseMap.size;

// --- Top 20 Themes ---
const themeCount = new Map();
for (const s of sets) {
  const th = String(s.th || '');
  themeCount.set(th, (themeCount.get(th) || 0) + 1);
}
function themeName(id) {
  const t = themes[id];
  if (!t) return `(unbekannt #${id})`;
  if (t.parent && themes[t.parent]) return `${themes[t.parent].name} > ${t.name}`;
  return t.name;
}
const topThemes = [...themeCount.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

// ---------- Ausgabe ----------
const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;

const out = [];
out.push('==================================================================');
out.push('  BRICKONAUT KATALOG-AUDIT');
out.push('==================================================================');
out.push(`  Quelle: src/data/catalog/catalog.json`);
out.push(`  fetchedAt: ${catalog.fetchedAt || '(unbekannt)'}`);
out.push(`  Sets gesamt: ${total.toLocaleString('de-DE')}`);
out.push(`  Zeitraum: ${minYear} - ${maxYear}`);
out.push(`  Themes referenziert: ${themeCount.size} (themes.json: ${Object.keys(themes).length})`);
out.push('');

out.push('------------------------------------------------------------------');
out.push('  DATENQUALITAET');
out.push('------------------------------------------------------------------');
out.push(`  Ohne Bild-URL (i leer):   ${noImage.toLocaleString('de-DE')}  (${pct(noImage)})`);
out.push(`  Ohne Teilezahl (p = 0):   ${noParts.toLocaleString('de-DE')}  (${pct(noParts)})`);
out.push(`  Ohne Jahr (y = 0):        ${noYear.toLocaleString('de-DE')}  (${pct(noYear)})`);
out.push('');

out.push('------------------------------------------------------------------');
out.push('  VARIANTEN / POTENZIELLE DUPLIKATE (Basisnummer vor "-")');
out.push('------------------------------------------------------------------');
out.push(`  Eindeutige Basisnummern:            ${uniqueBases.toLocaleString('de-DE')}`);
out.push(`  Basen mit mehreren Varianten:       ${basesWithMultiple.toLocaleString('de-DE')}`);
out.push(`  Sets, die zu Multi-Varianten-Basen gehoeren: ${variantSetsCount.toLocaleString('de-DE')}  (${pct(variantSetsCount)})`);
out.push(`  Groesste Variantengruppe:           ${maxVariants} Varianten (Basis ${maxVariantsBase})`);
out.push('  Hinweis: Mehrere Varianten pro Basis sind normal (Re-Releases, Regionen, Packs).');
out.push('');

out.push('------------------------------------------------------------------');
out.push('  SETS PRO JAHR (1949 - 2027)');
out.push('------------------------------------------------------------------');
out.push('  Jahr   Anzahl   Balken');
const maxCount = Math.max(...years.map((y) => byYear.get(y)));
for (let y = 1949; y <= 2027; y += 1) {
  const c = byYear.get(y) || 0;
  const barLen = maxCount ? Math.round((c / maxCount) * 40) : 0;
  const bar = '#'.repeat(barLen);
  out.push(`  ${y}   ${String(c).padStart(6)}   ${bar}`);
}
if (noYear > 0) {
  out.push(`  ????   ${String(noYear).padStart(6)}   (ohne Jahresangabe)`);
}
out.push('');

// Summen fuer letzte 10 Jahre (fuer den Plausibilitaetsvergleich)
out.push('------------------------------------------------------------------');
out.push('  LETZTE ~12 JAHRE (fuer Vergleich mit oeffentlichen Quellen)');
out.push('------------------------------------------------------------------');
for (let y = 2015; y <= 2027; y += 1) {
  out.push(`  ${y}: ${byYear.get(y) || 0}`);
}
out.push('');

out.push('------------------------------------------------------------------');
out.push('  TOP 20 THEMES NACH SET-ANZAHL');
out.push('------------------------------------------------------------------');
out.push('  Rang  Anzahl  Theme (ID)');
topThemes.forEach(([id, count], idx) => {
  out.push(`  ${String(idx + 1).padStart(3)}  ${String(count).padStart(6)}  ${themeName(id)}  [${id}]`);
});
out.push('');

out.push('==================================================================');
out.push('  ENDE REPORT');
out.push('==================================================================');

process.stdout.write(out.join('\n') + '\n');
