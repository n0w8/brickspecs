/**
 * Testskript: Brickognize-API real durchspielen.
 *
 * 1. Lädt ein Beispielbild (Set 10188-1 Death Star) von Rebrickable herunter.
 * 2. Schickt es als multipart/form-data (Feld "query_image") an
 *    https://api.brickognize.com/predict/sets/ und /predict/.
 * 3. Gibt die echte Antwortstruktur aus.
 *
 * Aufruf: node scripts/test-scan.mjs [pfad-zu-eigenem-bild]
 * Optional gegen die lokale Route: node scripts/test-scan.mjs --local
 */

const IMG_URL = "https://cdn.rebrickable.com/media/sets/10188-1.jpg";
const UA = "Brickonaut/1.0 (LEGO portal scanner; contact: dev@brickonaut.example)";

async function loadImage() {
  const fileArg = process.argv.slice(2).find((a) => !a.startsWith("-"));
  if (fileArg) {
    const { readFile } = await import("node:fs/promises");
    const buf = await readFile(fileArg);
    return new Blob([buf], { type: "image/jpeg" });
  }
  console.log(`Lade Testbild: ${IMG_URL}`);
  const res = await fetch(IMG_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Bild-Download fehlgeschlagen: ${res.status}`);
  const buf = await res.arrayBuffer();
  console.log(`Bild geladen: ${(buf.byteLength / 1024).toFixed(1)} KB\n`);
  return new Blob([buf], { type: "image/jpeg" });
}

async function predict(endpoint, blob) {
  const form = new FormData();
  form.append("query_image", blob, "test.jpg");
  const t0 = Date.now();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "User-Agent": UA },
    body: form,
  });
  const ms = Date.now() - t0;
  console.log(`POST ${endpoint} -> ${res.status} (${ms} ms)`);
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2).slice(0, 4000));
    return json;
  } catch {
    console.log(text.slice(0, 1000));
    return null;
  }
}

const blob = await loadImage();

if (process.argv.includes("--local")) {
  const form = new FormData();
  form.append("image", blob, "test.jpg");
  const res = await fetch("http://localhost:3100/api/scan", { method: "POST", body: form });
  console.log(`POST /api/scan -> ${res.status}`);
  console.log(JSON.stringify(await res.json(), null, 2).slice(0, 4000));
} else {
  console.log("=== /predict/sets/ ===");
  await predict("https://api.brickognize.com/predict/sets/", blob);
  console.log("\n=== /predict/ (alle Typen) ===");
  await predict("https://api.brickognize.com/predict/", blob);
}
