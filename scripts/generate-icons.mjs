/**
 * generate-icons.mjs — erzeugt alle App-Icons für Brickonaut (PWA).
 *
 * Motiv: freundlicher roter 2×2-LEGO-Stein (leicht 3D, 4 helle Noppen)
 * auf dunklem, abgerundetem Quadrat (#0a0e1a) mit dezentem gelbem Akzent
 * (Noppen-Glanz + Unterkante). Kein Text.
 *
 * Ausgaben:
 *   src/app/icon.png                  512×512  (abgerundet, transparente Ecken)
 *   src/app/apple-icon.png            180×180  (volles Quadrat, iOS rundet selbst)
 *   public/icons/icon-192.png         192×192  (abgerundet)
 *   public/icons/icon-512.png         512×512  (abgerundet)
 *   public/icons/icon-maskable-512.png 512×512 (volles Quadrat, ~20 % Safe-Zone)
 *
 * Aufruf: node scripts/generate-icons.mjs
 */

import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Farbpalette (Brickonaut-Theme)
// ---------------------------------------------------------------------------
const C = {
  bg: "#0a0e1a", // dunkler Hintergrund
  bgGlow: "#182138", // dezenter Glow hinter dem Stein
  redFront: "#d01012", // Frontfläche des Steins
  redTop: "#e8352c", // Oberseite (heller, Licht von oben)
  redSide: "#8f090c", // rechte Seitenfläche (Schatten)
  studSide: "#b30d10", // Noppen-Zylinderwand
  studTop: "#f4695d", // Noppen-Oberseite (hell)
  yellow: "#f6c700", // Akzent: Noppen-Glanz + Unterkante
};

// ---------------------------------------------------------------------------
// SVG-Bausteine
// ---------------------------------------------------------------------------

/** Eine Noppe (Zylinder) mit gelbem Glanzbogen. (cx, cy) = Fußpunkt-Mitte. */
function stud(cx, cy, rx = 27, ry = 11, h = 20) {
  const top = cy - h;
  return `
    <path d="M ${cx - rx} ${top} L ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L ${cx + rx} ${top} Z" fill="${C.studSide}"/>
    <ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="${C.studTop}"/>
    <path d="M ${cx - rx + 10} ${top} A ${rx - 10} ${ry - 4.5} 0 0 1 ${cx - 2} ${top - ry + 4.5}"
          fill="none" stroke="${C.yellow}" stroke-width="3.5" stroke-linecap="round" opacity="0.75"/>`;
}

/** Der komplette 2×2-Stein als <g>-Gruppe (leicht schräg von vorn-oben). */
function brick() {
  // Frontfläche: x 116–356, y 236–396; Tiefenversatz (+60, −48)
  // Noppen-Zentren auf der Oberseite (2×2-Raster, hintere Reihe zuerst)
  const studs =
    stud(225, 202) + stud(331, 202) + stud(201, 222) + stud(307, 222);

  return `
  <g transform="translate(-10 -14)">
    <!-- Bodenschatten -->
    <ellipse cx="266" cy="406" rx="152" ry="17" fill="#000000" opacity="0.35"/>
    <!-- rechte Seitenfläche -->
    <polygon points="356,236 416,188 416,348 356,396" fill="${C.redSide}"/>
    <!-- Oberseite -->
    <polygon points="116,236 356,236 416,188 176,188" fill="${C.redTop}"/>
    <!-- Frontfläche (untere Ecken abgerundet = freundlich) -->
    <path d="M 116 236 H 356 V 384 Q 356 396 344 396 H 128 Q 116 396 116 384 Z" fill="${C.redFront}"/>
    <!-- heller Kantenschimmer an der Vorderkante der Oberseite -->
    <line x1="120" y1="236" x2="352" y2="236" stroke="#ff5f52" stroke-width="3" opacity="0.6"/>
    <!-- Noppen -->
    ${studs}
    <!-- dezenter gelber Akzent an der Unterkante -->
    <rect x="128" y="388" width="216" height="7" rx="3.5" fill="${C.yellow}" opacity="0.9"/>
  </g>`;
}

/**
 * Komplettes Icon-SVG (512×512).
 * @param {boolean} rounded  abgerundetes Quadrat (true) oder volle Fläche (false)
 * @param {number}  scale    Inhalt-Skalierung um die Mitte (Safe-Zone für maskable)
 */
function iconSvg({ rounded = true, scale = 1 } = {}) {
  const rx = rounded ? 96 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="78%">
      <stop offset="0%" stop-color="${C.bgGlow}"/>
      <stop offset="100%" stop-color="${C.bg}"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="${rx}" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    ${brick()}
  </g>
</svg>`;
}

// ---------------------------------------------------------------------------
// Rendern
// ---------------------------------------------------------------------------
const TARGETS = [
  { file: "src/app/icon.png", size: 512, opts: { rounded: true } },
  { file: "src/app/apple-icon.png", size: 180, opts: { rounded: false } },
  { file: "public/icons/icon-192.png", size: 192, opts: { rounded: true } },
  { file: "public/icons/icon-512.png", size: 512, opts: { rounded: true } },
  // maskable: volle Fläche + ~20 % Safe-Zone-Padding (Inhalt auf 80 % skaliert)
  {
    file: "public/icons/icon-maskable-512.png",
    size: 512,
    opts: { rounded: false, scale: 0.8 },
  },
];

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch (err) {
  console.error(
    "FEHLER: sharp konnte nicht geladen werden (" +
      err.message +
      ").\nBitte `npm install sharp` ausführen oder den PNG-Fallback ergänzen.",
  );
  process.exit(1);
}

for (const { file, size, opts } of TARGETS) {
  const out = path.join(ROOT, file);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(iconSvg(opts)))
    .resize(size, size)
    .png()
    .toFile(out);
  const { size: bytes } = await stat(out);
  console.log(`  ✓ ${file}  ${size}×${size}  (${(bytes / 1024).toFixed(1)} kB)`);
}

console.log("Alle Icons erzeugt.");
