"use client";

// Box-Code-Scanner fuer die LEGO-Minifiguren-Sammelserien (Blind Boxes).
//
// Auf der Unterseite jeder Box sitzt ein Data-Matrix-Code, der eine
// 7-stellige Element-Nummer enthaelt - und die verraet die Figur. Die
// Erkennung laeuft KOMPLETT im Browser (zxing-wasm): kein Upload, kein
// Server, keine Speicherung. Drei Wege: Live-Kamera, Foto, Code eintippen.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CMF_SERIES, matchCmfCode, type CmfMatch } from "@/data/cmf-codes";
import { pick, useLang } from "@/lib/i18n";

const TXT = {
  title: { de: "Box-Code-Scanner", en: "Box code scanner" },
  sub: {
    de: "Welche Minifigur steckt in der Blind Box? Scanne den kleinen quadratischen Code auf der Unterseite der Box - direkt im Browser, ohne App.",
    en: "Which minifig is inside the blind box? Scan the small square code on the bottom of the box - right in your browser, no app needed.",
  },
  startCamera: { de: "Kamera starten", en: "Start camera" },
  stopCamera: { de: "Kamera stoppen", en: "Stop camera" },
  cameraHint: {
    de: "Halte den quadratischen Data-Matrix-Code (rechts neben dem Strichcode) nah vor die Kamera.",
    en: "Hold the square Data Matrix code (next to the barcode) close to the camera.",
  },
  cameraError: {
    de: "Kamera nicht verfügbar oder Zugriff abgelehnt. Nutze stattdessen ein Foto oder tippe den Code ein.",
    en: "Camera unavailable or access denied. Use a photo or type the code instead.",
  },
  photoBtn: { de: "Foto vom Code aufnehmen", en: "Take a photo of the code" },
  manualLabel: {
    de: "Oder Code eintippen (7 Ziffern, unter dem Data-Matrix-Code)",
    en: "Or type the code (7 digits, printed near the Data Matrix code)",
  },
  manualPlaceholder: { de: "z. B. 6603331", en: "e.g. 6603331" },
  check: { de: "Prüfen", en: "Check" },
  scanning: { de: "Suche Code ...", en: "Looking for a code ..." },
  noCodeInPhoto: {
    de: "Kein Code im Foto gefunden. Geh näher ran, sorge für Licht und halte die Kamera ruhig.",
    en: "No code found in the photo. Get closer, add light and hold steady.",
  },
  unknownCode: {
    de: "Code gelesen, aber noch keiner Figur zugeordnet. Vermutlich eine Serie, die wir noch nicht erfasst haben.",
    en: "Code detected, but not mapped to a figure yet. Probably a series we have not covered yet.",
  },
  resultTitle: { de: "In dieser Box steckt", en: "Inside this box" },
  figureNo: { de: "Figur", en: "Figure" },
  matchedCode: { de: "Erkannter Code", en: "Matched code" },
  scanNext: { de: "Nächste Box scannen", en: "Scan next box" },
  seriesLexikon: { de: "Serie im Lexikon", en: "Series in the lexicon" },
  allFigures: { de: "Alle Figuren der Serie", en: "All figures in this series" },
  supported: { de: "Unterstützte Serien", en: "Supported series" },
  privacy: {
    de: "🔒 Alles passiert lokal in deinem Browser - Fotos und Kamerabilder werden nirgendwo hochgeladen oder gespeichert.",
    en: "🔒 Everything runs locally in your browser - photos and camera frames are never uploaded or stored.",
  },
  setScannerLink: {
    de: "Ganzes Set oder einzelne Figur fotografieren? → Zum Foto-Scanner",
    en: "Want to identify a full set or a loose minifig? → Photo scanner",
  },
};

type ZxingReader = typeof import("zxing-wasm/reader");

let readerPromise: Promise<ZxingReader> | null = null;
function loadReader(): Promise<ZxingReader> {
  if (!readerPromise) readerPromise = import("zxing-wasm/reader");
  return readerPromise;
}

async function decodeImageData(img: ImageData): Promise<string | null> {
  const { readBarcodes } = await loadReader();
  const results = await readBarcodes(img, {
    formats: ["DataMatrix", "QRCode"],
    tryHarder: true,
    maxNumberOfSymbols: 2,
  });
  return results.find((r) => r.text)?.text ?? null;
}

async function decodeBlob(blob: Blob): Promise<string | null> {
  const { readBarcodes } = await loadReader();
  const results = await readBarcodes(blob, {
    formats: ["DataMatrix", "QRCode"],
    tryHarder: true,
    maxNumberOfSymbols: 2,
  });
  return results.find((r) => r.text)?.text ?? null;
}

export default function BoxScannerClient() {
  const { lang } = useLang();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [busyPhoto, setBusyPhoto] = useState(false);
  const [manual, setManual] = useState("");
  const [match, setMatch] = useState<CmfMatch | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (loopRef.current !== null) {
      window.clearInterval(loopRef.current);
      loopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const handleDecoded = useCallback(
    (text: string): boolean => {
      const found = matchCmfCode(text);
      if (found) {
        setMatch(found);
        setNotice(null);
        return true;
      }
      setNotice(TXT.unknownCode[lang]);
      return false;
    },
    [lang]
  );

  const startCamera = useCallback(async () => {
    setMatch(null);
    setNotice(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      // Video-Element erst nach dem Re-Render verdrahten
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        void video.play();

        const canvas = document.createElement("canvas");
        loopRef.current = window.setInterval(async () => {
          if (busyRef.current || !video.videoWidth) return;
          busyRef.current = true;
          try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(video, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const text = await decodeImageData(img);
            if (text && handleDecoded(text)) stopCamera();
          } catch {
            // Einzelbild fehlgeschlagen - einfach mit dem naechsten weitermachen
          } finally {
            busyRef.current = false;
          }
        }, 450);
      });
    } catch {
      setNotice(TXT.cameraError[lang]);
      setCameraOn(false);
    }
  }, [handleDecoded, lang, stopCamera]);

  const onPhoto = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setMatch(null);
      setNotice(null);
      setBusyPhoto(true);
      try {
        const text = await decodeBlob(file);
        if (!text) setNotice(TXT.noCodeInPhoto[lang]);
        else handleDecoded(text);
      } catch {
        setNotice(TXT.noCodeInPhoto[lang]);
      } finally {
        setBusyPhoto(false);
      }
    },
    [handleDecoded, lang]
  );

  const onManual = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (manual.replace(/\D+/g, "").length < 7) return;
      setMatch(null);
      handleDecoded(manual);
    },
    [manual, handleDecoded]
  );

  const reset = () => {
    setMatch(null);
    setNotice(null);
    setManual("");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <section className="text-center">
        <h1 className="text-3xl font-extrabold sm:text-4xl">🎁 {TXT.title[lang]}</h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">{TXT.sub[lang]}</p>
      </section>

      {/* Ergebnis */}
      {match && (
        <section className="mt-8">
          <div className="card overflow-hidden border-2 !border-[var(--yellow)]">
            <div className="p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                {TXT.resultTitle[lang]}
              </p>
              <p className="mt-3 text-3xl font-extrabold">
                {pick(match.figure.name, lang)}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {TXT.figureNo[lang]} {match.figure.no}/12 · {pick(match.series.name, lang)} (
                {match.series.setNumber})
              </p>
              <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                {TXT.matchedCode[lang]}: {match.code}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button type="button" className="btn btn-primary" onClick={reset}>
                  📷 {TXT.scanNext[lang]}
                </button>
                <Link
                  href={`/lexikon/${match.series.setNumber}-1`}
                  className="btn"
                >
                  📖 {TXT.seriesLexikon[lang]}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hinweis (unbekannter Code, Kamera-Fehler, kein Code im Foto) */}
      {notice && (
        <section className="card mt-6 p-4 text-center text-sm text-[var(--muted)]">
          ⚠️ {notice}
        </section>
      )}

      {/* Scan-Wege */}
      {!match && (
        <section className="mt-8 flex flex-col gap-4">
          {/* Live-Kamera */}
          <div className="card p-5">
            {cameraOn ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption -- stummer Kamera-Sucher */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="max-h-80 w-full rounded-xl bg-black object-contain"
                />
                <p className="text-center text-xs text-[var(--muted)]">{TXT.cameraHint[lang]}</p>
                <button type="button" className="btn" onClick={stopCamera}>
                  ⏹ {TXT.stopCamera[lang]}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <span className="text-4xl" aria-hidden>
                  📸
                </span>
                <button type="button" className="btn btn-primary" onClick={() => void startCamera()}>
                  {TXT.startCamera[lang]}
                </button>
                <label className="btn cursor-pointer">
                  {busyPhoto ? TXT.scanning[lang] : `🖼 ${TXT.photoBtn[lang]}`}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => void onPhoto(e)}
                    disabled={busyPhoto}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Manuell */}
          <form className="card flex flex-col gap-2 p-5" onSubmit={onManual}>
            <label htmlFor="cmf-code" className="text-sm font-semibold">
              ⌨️ {TXT.manualLabel[lang]}
            </label>
            <div className="flex gap-2">
              <input
                id="cmf-code"
                className="input font-mono"
                inputMode="numeric"
                placeholder={TXT.manualPlaceholder[lang]}
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
              <button type="submit" className="btn btn-primary shrink-0">
                {TXT.check[lang]}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-[var(--muted)]">{TXT.privacy[lang]}</p>
        </section>
      )}

      {/* Alle Figuren der getroffenen Serie */}
      {match && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">{TXT.allFigures[lang]}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {match.series.figures.map((f) => (
              <div
                key={f.no}
                className={`card p-3 text-sm ${
                  f.no === match.figure.no ? "border-2 !border-[var(--yellow)] font-bold" : ""
                }`}
              >
                <span className="font-mono text-xs text-[var(--muted)]">#{f.no}</span>{" "}
                {pick(f.name, lang)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unterstützte Serien */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold">📦 {TXT.supported[lang]}</h2>
        <div className="flex flex-col gap-2">
          {CMF_SERIES.map((s) => (
            <Link
              key={s.setNumber}
              href={`/lexikon/${s.setNumber}-1`}
              className="card card-hover flex items-center justify-between p-4"
            >
              <span className="font-semibold">{pick(s.name, lang)}</span>
              <span className="text-xs text-[var(--muted)]">
                {s.setNumber} · {pick(s.window, lang)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-8 text-center text-sm">
        <Link href="/scanner" className="text-[var(--yellow)] hover:underline">
          {TXT.setScannerLink[lang]}
        </Link>
      </p>
    </div>
  );
}
