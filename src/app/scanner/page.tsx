"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import BrickImage from "@/components/BrickImage";

const TXT = {
  title: { de: "📸 Set-Scanner", en: "📸 Set Scanner" },
  sub: {
    de: "Fotografiere ein Set oder seinen Karton - BrickSpecs erkennt es und öffnet den Steckbrief.",
    en: "Take a photo of a set or its box - BrickSpecs identifies it and opens its profile.",
  },
  dropTitle: { de: "Foto aufnehmen oder hochladen", en: "Take or upload a photo" },
  dropHint: {
    de: "Tippe hier, um die Kamera zu öffnen oder ein Bild auszuwählen",
    en: "Tap here to open the camera or choose an image",
  },
  dropHintDesktop: {
    de: "Du kannst ein Bild auch einfach hierher ziehen",
    en: "You can also drag an image here",
  },
  scanning: { de: "Scanne Noppen ...", en: "Scanning studs ..." },
  scanningSub: {
    de: "Dein Foto wird gerade mit über 20.000 Sets verglichen.",
    en: "Your photo is being compared against 20,000+ sets.",
  },
  bestMatch: { de: "Bester Treffer", en: "Best match" },
  confidence: { de: "Konfidenz", en: "Confidence" },
  toProfile: { de: "Zum Steckbrief", en: "Open profile" },
  redirecting: {
    de: "Öffne Steckbrief in",
    en: "Opening profile in",
  },
  cancelRedirect: { de: "Abbrechen", en: "Cancel" },
  moreResults: { de: "Weitere Treffer", en: "More results" },
  typeSet: { de: "Set", en: "Set" },
  typePart: { de: "Teil", en: "Part" },
  typeFig: { de: "Minifigur", en: "Minifigure" },
  typeSticker: { de: "Sticker", en: "Sticker" },
  noSetFound: {
    de: "Kein Set erkannt",
    en: "No set recognized",
  },
  noSetFoundSub: {
    de: "Wir konnten auf dem Foto leider kein LEGO-Set sicher erkennen.",
    en: "We could not confidently recognize a LEGO set in this photo.",
  },
  errorTitle: { de: "Scan fehlgeschlagen", en: "Scan failed" },
  tipsTitle: { de: "Tipps für bessere Treffer", en: "Tips for better matches" },
  tip1: {
    de: "Gutes Licht: Tageslicht oder helle Lampe, keine starken Schatten",
    en: "Good light: daylight or a bright lamp, no harsh shadows",
  },
  tip2: {
    de: "Karton-Front fotografieren: Die Vorderseite mit Set-Bild funktioniert am besten",
    en: "Shoot the box front: the front with the set image works best",
  },
  tip3: {
    de: "Ein Set pro Foto: Mehrere Sets auf einem Bild verwirren die Erkennung",
    en: "One set per photo: multiple sets in one shot confuse the detection",
  },
  tryAgain: { de: "Neues Foto scannen", en: "Scan another photo" },
  privacy: {
    de: "Dein Foto wird zur Erkennung an Brickognize gesendet und nicht gespeichert.",
    en: "Your photo is sent to Brickognize for recognition and is not stored.",
  },
  credit: { de: "Erkennung powered by Brickognize", en: "Recognition powered by Brickognize" },
  errTooLarge: {
    de: "Dieses Foto konnte nicht verarbeitet werden. iPhone-Tipp: Einstellungen -> Kamera -> Formate -> 'Maximale Kompatibilität' waehlen, oder mach einen Screenshot vom Foto und scanne den.",
    en: "This photo could not be processed. iPhone tip: Settings -> Camera -> Formats -> 'Most Compatible', or take a screenshot of the photo and scan that.",
  },
  errNotImage: {
    de: "Bitte wähle eine Bilddatei (JPG, PNG, WebP ...).",
    en: "Please choose an image file (JPG, PNG, WebP ...).",
  },
  errGeneric: {
    de: "Die Erkennung ist gerade nicht erreichbar. Bitte versuche es später erneut.",
    en: "Recognition is currently unavailable. Please try again later.",
  },
  errRateLimit: {
    de: "Zu viele Scans in kurzer Zeit. Bitte warte einen Moment.",
    en: "Too many scans in a short time. Please wait a moment.",
  },
  errTimeout: {
    de: "Die Erkennung hat zu lange gedauert. Bitte versuche es erneut.",
    en: "Recognition took too long. Please try again.",
  },
} as const;

interface ScanItem {
  id: string;
  name: string;
  score: number;
  img: string;
  type: string;
  /** Nur bei Minifiguren: Sets, in denen die Figur vorkommt */
  sets?: string[];
  setCount?: number;
  /** Nur bei Minifiguren: existiert eine Steckbrief-Seite bei uns? */
  known?: boolean;
  /** Nur bei Minifiguren: Katalog-ID ("fig-..."), falls die Erkennung eine BrickLink-ID lieferte */
  figId?: string;
  /** Nur bei Sets: enthaltene Minifiguren */
  figs?: Array<{ id: string; name: string; img: string }>;
  figCount?: number;
}

/** Echtes Upload-Limit: Vercel-Functions kappen Request-Bodys bei ~4,5 MB. */
const MAX_BYTES = 4 * 1024 * 1024;
const AUTO_REDIRECT_SCORE = 0.55;
const COUNTDOWN_SECONDS = 3;

/** Max. Kantenlänge fürs Hochladen - mehr braucht die Erkennung nicht. */
const MAX_DIMENSION = 1600;
/** Ab dieser Größe wird clientseitig verkleinert (Handy-Fotos sind oft 5-20 MB). */
const DOWNSCALE_THRESHOLD = 1.5 * 1024 * 1024;

function drawToJpeg(
  source: CanvasImageSource,
  width: number,
  height: number
): Promise<File | null> {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(source, 0, 0, w, h);
  return new Promise((resolve) =>
    canvas.toBlob(
      (blob) =>
        resolve(
          blob && blob.size > 0 ? new File([blob], "scan.jpg", { type: "image/jpeg" }) : null
        ),
      "image/jpeg",
      0.85
    )
  );
}

/** Fallback-Dekodierung über ein <img>-Element (hilft z. B. bei HEIC in Safari). */
function decodeViaImg(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Verkleinert das Foto direkt im Browser (Canvas -> JPEG), damit auch
 * 20-MB-Handyfotos problemlos durchgehen. Zwei Dekodier-Wege:
 * createImageBitmap (schnell) und <img>-Element (Safari/HEIC-Fallback).
 * Liefert null, wenn das Format gar nicht dekodierbar ist.
 */
async function downscaleImage(file: File): Promise<File | null> {
  if (file.size <= DOWNSCALE_THRESHOLD) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const result = await drawToJpeg(bitmap, bitmap.width, bitmap.height);
    bitmap.close();
    if (result) return result;
  } catch {
    // weiter zum Fallback
  }

  const img = await decodeViaImg(file);
  if (img) {
    const result = await drawToJpeg(img, img.naturalWidth, img.naturalHeight);
    URL.revokeObjectURL(img.src);
    if (result) return result;
  }

  // Nicht dekodierbar: kleine Dateien roh durchlassen, große klar ablehnen
  return file.size <= MAX_BYTES ? file : null;
}

type Status = "idle" | "scanning" | "done" | "error";

function typeLabel(type: string, lang: "de" | "en"): string {
  if (type === "set") return TXT.typeSet[lang];
  if (type === "fig") return TXT.typeFig[lang];
  if (type === "sticker") return TXT.typeSticker[lang];
  return TXT.typePart[lang];
}

/**
 * Interner Link zum Steckbrief. Minifiguren nur, wenn die API bestaetigt hat,
 * dass die Seite bei uns existiert (known) - sonst gibt es einen 404.
 * figId ist die vom Server aufgelöste Katalog-ID (BrickLink→Rebrickable).
 */
function hrefFor(item: ScanItem): string | null {
  if (item.type === "set") return `/lexikon/${encodeURIComponent(item.id)}`;
  if ((item.type === "fig" || item.id.startsWith("fig-")) && item.known) {
    return `/minifiguren/${encodeURIComponent(item.figId ?? item.id)}`;
  }
  return null;
}

function scoreColor(score: number): string {
  if (score >= 0.55) return "var(--green)";
  if (score >= 0.35) return "var(--yellow)";
  return "#ff6b6c";
}

export default function ScannerPage() {
  const { lang } = useLang();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Bester Treffer: Set ODER Minifigur (die Liste ist bereits Sets-zuerst sortiert;
  // bei einem Figuren-Foto ohne Set-Treffer steht die Figur vorn).
  const bestSet = items.find((i) => i.type === "set" || i.type === "fig") ?? null;
  const otherItems = items.filter((i) => i !== bestSet);

  // Objekt-URL der Vorschau beim Wechsel/Unmount freigeben
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Countdown für die Auto-Weiterleitung zum besten Set-Treffer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      const href = bestSet ? hrefFor(bestSet) : null;
      if (href) router.push(href);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, bestSet, router]);

  const reset = useCallback(() => {
    setStatus("idle");
    setItems([]);
    setErrorMsg(null);
    setCountdown(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const scan = useCallback(
    async (file: File) => {
      setCountdown(null);
      setItems([]);
      setErrorMsg(null);

      if (file.type && !file.type.startsWith("image/")) {
        setStatus("error");
        setErrorMsg(TXT.errNotImage[lang]);
        return;
      }

      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(file);
      });
      setStatus("scanning");

      // Grosse Handyfotos direkt im Browser verkleinern - schneller Upload,
      // und das Upload-Limit wird praktisch nie mehr erreicht.
      const upload = await downscaleImage(file);
      if (!upload || upload.size > MAX_BYTES) {
        setStatus("error");
        setErrorMsg(TXT.errTooLarge[lang]);
        return;
      }

      try {
        const form = new FormData();
        form.append("image", upload, upload.name || "scan.jpg");
        const res = await fetch("/api/scan", { method: "POST", body: form });

        if (!res.ok) {
          setStatus("error");
          if (res.status === 429) setErrorMsg(TXT.errRateLimit[lang]);
          else if (res.status === 504) setErrorMsg(TXT.errTimeout[lang]);
          else if (res.status === 413) setErrorMsg(TXT.errTooLarge[lang]);
          else setErrorMsg(TXT.errGeneric[lang]);
          return;
        }

        const data = (await res.json()) as { items?: ScanItem[] };
        const found = Array.isArray(data.items) ? data.items : [];
        setItems(found);
        setStatus("done");

        const top = found.find((i) => i.type === "set" || i.type === "fig");
        if (top && top.score >= AUTO_REDIRECT_SCORE && hrefFor(top) !== null) {
          setCountdown(COUNTDOWN_SECONDS);
        }
      } catch {
        setStatus("error");
        setErrorMsg(TXT.errGeneric[lang]);
      }
    },
    [lang]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void scan(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void scan(file);
  };

  const pct = (score: number) => Math.round(score * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{TXT.title[lang]}</h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">{TXT.sub[lang]}</p>
      </section>

      {/* Upload-/Kamera-Bereich */}
      <section className="mt-8">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          id="scanner-file"
          onChange={onFileChange}
        />

        {status === "idle" && (
          <label
            htmlFor="scanner-file"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragOver
                ? "border-[var(--yellow)] bg-[rgba(246,199,0,0.08)]"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--yellow)]"
            }`}
          >
            <span className="text-5xl" aria-hidden>
              🧱
            </span>
            <span className="text-lg font-bold">{TXT.dropTitle[lang]}</span>
            <span className="text-sm text-[var(--muted)]">{TXT.dropHint[lang]}</span>
            <span className="hidden text-xs text-[var(--muted)] sm:block">
              {TXT.dropHintDesktop[lang]}
            </span>
            <span className="btn btn-primary mt-2">📷 {TXT.dropTitle[lang]}</span>
          </label>
        )}

        {/* Vorschau + Lade-Zustand */}
        {status !== "idle" && previewUrl && (
          <div className="card overflow-hidden">
            <div className="relative flex max-h-72 items-center justify-center bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element -- lokale Objekt-URL der Nutzer-Vorschau */}
              <img
                src={previewUrl}
                alt={lang === "de" ? "Dein Foto" : "Your photo"}
                className="max-h-72 w-auto object-contain"
              />
              {status === "scanning" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm">
                  <span className="animate-bounce text-4xl" aria-hidden>
                    🧱
                  </span>
                  <span className="font-bold">{TXT.scanning[lang]}</span>
                  <span className="px-6 text-center text-xs text-[var(--muted)]">
                    {TXT.scanningSub[lang]}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Fehler-Zustand */}
      {status === "error" && (
        <section className="card mt-6 p-6 text-center">
          <span className="text-3xl" aria-hidden>
            ⚠️
          </span>
          <h2 className="mt-2 text-lg font-bold">{TXT.errorTitle[lang]}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{errorMsg}</p>
          <button type="button" className="btn btn-primary mt-4" onClick={reset}>
            {TXT.tryAgain[lang]}
          </button>
        </section>
      )}

      {/* Ergebnis: bestes Set */}
      {status === "done" && bestSet && (
        <section className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {TXT.bestMatch[lang]}
          </p>
          <div className="card card-hover overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <BrickImage
                src={bestSet.img}
                alt={bestSet.name}
                label={bestSet.id}
                className="h-48 w-full shrink-0 sm:h-auto sm:w-56"
              />
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <span className="badge badge-yellow">{typeLabel(bestSet.type, lang)}</span>
                  <h2 className="mt-2 text-xl font-extrabold">{bestSet.name}</h2>
                  <p className="font-mono text-sm text-[var(--muted)]">{bestSet.id}</p>
                </div>

                {/* Konfidenz-Balken */}
                <div>
                  <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                    <span>{TXT.confidence[lang]}</span>
                    <span className="font-bold text-[var(--text)]">{pct(bestSet.score)} %</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct(bestSet.score)}%`,
                        background: scoreColor(bestSet.score),
                      }}
                    />
                  </div>
                </div>

                {/* Set: enthaltene Minifiguren */}
                {bestSet.type === "set" && bestSet.figs && bestSet.figs.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      👤 {bestSet.figCount}{" "}
                      {lang === "de"
                        ? `Minifigur${bestSet.figCount === 1 ? "" : "en"} im Set`
                        : `minifig${bestSet.figCount === 1 ? "" : "s"} in this set`}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {bestSet.figs.map((fig) => (
                        <Link
                          key={fig.id}
                          href={`/minifiguren/${encodeURIComponent(fig.id)}`}
                          className="chip flex items-center gap-1.5 !py-1"
                          title={fig.name}
                        >
                          {fig.img ? (
                            // eslint-disable-next-line @next/next/no-img-element -- kleine CDN-Thumbnails
                            <img
                              src={fig.img}
                              alt=""
                              className="h-6 w-6 rounded object-contain bg-white/90"
                              loading="lazy"
                            />
                          ) : null}
                          <span className="max-w-36 truncate text-xs">{fig.name}</span>
                        </Link>
                      ))}
                      {(bestSet.figCount ?? 0) > bestSet.figs.length && (
                        <span className="badge badge-gray">
                          +{(bestSet.figCount ?? 0) - bestSet.figs.length}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Minifigur: Sets, in denen die Figur vorkommt */}
                {bestSet.type === "fig" && bestSet.sets && bestSet.sets.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      📦 {lang === "de" ? "Kommt vor in" : "Appears in"} {bestSet.setCount}{" "}
                      {lang === "de" ? "Sets" : "sets"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {bestSet.sets.map((sid) => (
                        <Link
                          key={sid}
                          href={`/lexikon/${encodeURIComponent(sid)}`}
                          className="badge badge-blue font-mono hover:!border-[var(--yellow)]"
                        >
                          {sid}
                        </Link>
                      ))}
                      {(bestSet.setCount ?? 0) > bestSet.sets.length && (
                        <span className="badge badge-gray">
                          +{(bestSet.setCount ?? 0) - bestSet.sets.length}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-3">
                  {hrefFor(bestSet) ? (
                    <Link href={hrefFor(bestSet)!} className="btn btn-primary">
                      {TXT.toProfile[lang]} →
                    </Link>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">
                      {lang === "de"
                        ? "Erkannt, aber noch kein Steckbrief in unserer Datenbank."
                        : "Recognized, but no profile in our database yet."}
                    </span>
                  )}
                  {countdown !== null && countdown > 0 && (
                    <span className="flex items-center gap-2 text-sm text-[var(--muted)]">
                      {TXT.redirecting[lang]} {countdown} s ...
                      <button
                        type="button"
                        className="chip"
                        onClick={() => setCountdown(null)}
                      >
                        {TXT.cancelRedirect[lang]}
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Ergebnis: kein Set erkannt */}
      {status === "done" && !bestSet && (
        <section className="card mt-6 p-6 text-center">
          <span className="text-3xl" aria-hidden>
            🔍
          </span>
          <h2 className="mt-2 text-lg font-bold">{TXT.noSetFound[lang]}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{TXT.noSetFoundSub[lang]}</p>
          <button type="button" className="btn btn-primary mt-4" onClick={reset}>
            {TXT.tryAgain[lang]}
          </button>
        </section>
      )}

      {/* Weitere Treffer */}
      {status === "done" && otherItems.length > 0 && (
        <section className="mt-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {TXT.moreResults[lang]}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {otherItems.map((item) => {
              const href = hrefFor(item);
              const inner = (
                <div className="flex items-center gap-3 p-3">
                  <BrickImage
                    src={item.img}
                    alt={item.name}
                    label={item.id}
                    className="h-16 w-16 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`badge ${item.type === "set" ? "badge-yellow" : "badge-gray"}`}
                      >
                        {typeLabel(item.type, lang)}
                      </span>
                      <span className="text-xs text-[var(--muted)]">{pct(item.score)} %</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-bold">{item.name}</p>
                    <p className="truncate font-mono text-xs text-[var(--muted)]">{item.id}</p>
                    {item.type === "fig" && (item.setCount ?? 0) > 0 && (
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                        📦 {lang === "de" ? "in" : "in"} {item.setCount}{" "}
                        {lang === "de" ? "Sets" : "sets"}: {item.sets?.slice(0, 3).join(", ")}
                        {(item.setCount ?? 0) > 3 ? " ..." : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
              return href ? (
                <Link key={`${item.type}-${item.id}`} href={href} className="card card-hover">
                  {inner}
                </Link>
              ) : (
                <div key={`${item.type}-${item.id}`} className="card">
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Nochmal scannen */}
      {status === "done" && (
        <div className="mt-6 text-center">
          <button type="button" className="btn" onClick={reset}>
            📷 {TXT.tryAgain[lang]}
          </button>
        </div>
      )}

      {/* Tipps bei Fehler oder ohne Set-Treffer */}
      {(status === "error" || (status === "done" && !bestSet)) && (
        <section className="card mt-6 p-5">
          <h3 className="text-sm font-bold">{TXT.tipsTitle[lang]}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--muted)]">
            <li>💡 {TXT.tip1[lang]}</li>
            <li>📦 {TXT.tip2[lang]}</li>
            <li>1️⃣ {TXT.tip3[lang]}</li>
          </ul>
        </section>
      )}

      {/* Datenschutz + Credit */}
      <footer className="mt-10 space-y-1 text-center text-xs text-[var(--muted)]">
        <p>🔒 {TXT.privacy[lang]}</p>
        <p>
          {TXT.credit[lang]} (
          <a
            href="https://brickognize.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[var(--text)]"
          >
            brickognize.com
          </a>
          )
        </p>
      </footer>
    </div>
  );
}
