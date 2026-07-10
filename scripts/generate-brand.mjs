// Erzeugt das komplette BrickSpecs-Logo-Paket (Brick mit Brille) aus SVG:
// Kanal-Avatare (branding/) + PWA-/App-Icons. Aufruf: node scripts/generate-brand.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Innenleben: gelber Brick mit Brille (specs = Datenblatt UND Brille)
const INNER = `
  <rect x="18" y="13" width="11" height="9" rx="2.5" fill="#f6c700"/>
  <rect x="35" y="13" width="11" height="9" rx="2.5" fill="#f6c700"/>
  <rect x="13" y="21" width="38" height="28" rx="5" fill="#f6c700"/>
  <rect x="13" y="32.5" width="5" height="3" fill="#0a0e1a"/>
  <rect x="46" y="32.5" width="5" height="3" fill="#0a0e1a"/>
  <rect x="28" y="32.5" width="8" height="3" fill="#0a0e1a"/>
  <circle cx="24" cy="34" r="6.5" fill="#0a0e1a"/>
  <circle cx="40" cy="34" r="6.5" fill="#0a0e1a"/>
  <circle cx="22" cy="32" r="2" fill="#2a6fd6"/>
  <circle cx="38" cy="32" r="2" fill="#2a6fd6"/>
  <rect x="27" y="43" width="10" height="2.5" rx="1.25" fill="#c79f00"/>`;

// Standard: rotes Badge mit runden Ecken (transparente Ecken)
const BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="2" y="2" width="60" height="60" rx="14" fill="#d01012"/>${INNER}
</svg>`;

// Maskable/Avatar: vollflaechig rot (fuer runde Zuschnitte und PWA-Masken)
const FULL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#d01012"/>
  <g transform="translate(6.4,6.4) scale(0.8)">${INNER}</g>
</svg>`;

async function render(svg, size, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`OK ${size}x${size}  ${outPath.replace(ROOT, "").replace(/^[\\/]/, "")}`);
}

/** Baut eine .ico mit PNG-Eintraegen (moderne Browser + Windows lesen das). */
async function renderIco(svg, sizes, outPath) {
  const pngs = [];
  for (const size of sizes) {
    const buf = await sharp(Buffer.from(svg), { density: 300 })
      .resize(size, size)
      .png()
      .toBuffer();
    pngs.push({ size, buf });
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // Typ: Icon
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + pngs.length * 16;
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // Breite
    e.writeUInt8(size >= 256 ? 0 : size, 1); // Hoehe
    e.writeUInt8(0, 2); // Farbpalette
    e.writeUInt8(0, 3); // reserviert
    e.writeUInt16LE(1, 4); // Farbebenen
    e.writeUInt16LE(32, 6); // Bits pro Pixel
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += buf.length;
  }
  const ico = Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
  mkdirSync(dirname(outPath), { recursive: true });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(outPath, ico);
  console.log(`OK ico (${sizes.join(",")})  ${outPath.replace(ROOT, "").replace(/^[\\/]/, "")}`);
}

// Favicon (Browser-Tab): ersetzt die Standard-favicon.ico durch das Brillen-Logo
await renderIco(BADGE_SVG, [16, 32, 48], join(ROOT, "src", "app", "favicon.ico"));

// Kanal-Avatare (Telegram, WhatsApp, Socials): vollflaechig, wird rund zugeschnitten
await render(FULL_SVG, 1024, join(ROOT, "branding", "logo-avatar-1024.png"));
await render(FULL_SVG, 512, join(ROOT, "branding", "logo-avatar-512.png"));
// Badge-Variante (Website, Posts, Banner-Baustein)
await render(BADGE_SVG, 1024, join(ROOT, "branding", "logo-badge-1024.png"));
// App-/PWA-Icons (ersetzen das alte Design)
await render(BADGE_SVG, 512, join(ROOT, "src", "app", "icon.png"));
await render(FULL_SVG, 180, join(ROOT, "src", "app", "apple-icon.png"));
await render(BADGE_SVG, 192, join(ROOT, "public", "icons", "icon-192.png"));
await render(BADGE_SVG, 512, join(ROOT, "public", "icons", "icon-512.png"));
await render(FULL_SVG, 512, join(ROOT, "public", "icons", "icon-maskable-512.png"));

console.log("\nLogo-Paket komplett.");
