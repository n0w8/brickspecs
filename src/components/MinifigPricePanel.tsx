"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";

/**
 * Eigenstaendiges Preis-Panel fuer Minifiguren (bewusst NICHT das Set-PricePanel
 * importieren). Laedt /api/minifig-prices/[figId] und zeigt im Live-Modus den
 * 6-Monats-Verkaufsschnitt (neu + gebraucht) aus BrickLink, im Demo-Modus einen
 * ehrlichen Platzhalter statt irrefuehrender Zufallszahlen.
 *
 * figId ist entweder die Rebrickable-ID ("fig-006583", Katalog-Seite) oder die
 * BrickLink-ID ("sw0107", kuratierte Figur) - die API kennt beide Wege.
 */
interface MinifigPriceData {
  figId: string;
  newEUR?: number | null;
  usedEUR?: number | null;
  newQty?: number;
  usedQty?: number;
  mode: "live" | "demo";
}

export default function MinifigPricePanel({ figId }: { figId: string }) {
  const { lang } = useLang();
  const [data, setData] = useState<MinifigPriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/minifig-prices/${encodeURIComponent(figId)}`)
      .then((r) => r.json())
      .then((json: MinifigPriceData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [figId]);

  const live = data?.mode === "live";

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-bold text-lg">
          💶 {lang === "de" ? "Marktpreise (BrickLink)" : "Market prices (BrickLink)"}
        </h2>
        {data && (
          <span className={`badge ${live ? "badge-green" : "badge-gray"}`}>
            {live ? "Live" : "Demo"}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">
          {lang === "de" ? "Preise werden geladen …" : "Loading prices …"}
        </p>
      ) : live ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card !bg-[var(--surface-2)] p-4">
              <p className="text-xs text-[var(--muted)] mb-1">
                {lang === "de" ? "Neu (6-Mon-Schnitt)" : "New (6-month avg)"}
              </p>
              <p className="text-2xl font-extrabold text-[var(--yellow)]">
                {formatEUR(data?.newEUR ?? null, lang)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {data?.newQty ?? 0} {lang === "de" ? "Verkäufe" : "sales"}
              </p>
            </div>
            <div className="card !bg-[var(--surface-2)] p-4">
              <p className="text-xs text-[var(--muted)] mb-1">
                {lang === "de" ? "Gebraucht (6-Mon-Schnitt)" : "Used (6-month avg)"}
              </p>
              <p className="text-2xl font-extrabold">{formatEUR(data?.usedEUR ?? null, lang)}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {data?.usedQty ?? 0} {lang === "de" ? "Verkäufe" : "sales"}
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">
            {lang === "de"
              ? "Durchschnittlicher Verkaufspreis der letzten 6 Monate, direkt aus dem BrickLink-Preisguide (neu/versiegelt bzw. gebraucht/lose)."
              : "Average sold price over the last 6 months, straight from the BrickLink price guide (new/sealed and used/loose)."}
          </p>
        </>
      ) : (
        // Ehrlicher Platzhalter: solange die BrickLink-Anbindung diese Figur
        // noch nicht erfasst hat, zeigen wir bewusst KEINE konkreten Preise.
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: lang === "de" ? "Neu (6-Mon-Schnitt)" : "New (6-month avg)", yellow: true },
            {
              label: lang === "de" ? "Gebraucht (6-Mon-Schnitt)" : "Used (6-month avg)",
              yellow: false,
            },
          ].map((slot) => (
            <div key={slot.label} className="card !bg-[var(--surface-2)] p-4">
              <p className="text-xs text-[var(--muted)] mb-1">{slot.label}</p>
              <p
                className={`text-2xl font-extrabold ${slot.yellow ? "text-[var(--yellow)]" : ""}`}
              >
                --
              </p>
            </div>
          ))}
          <p className="sm:col-span-2 text-xs text-[var(--muted)] leading-relaxed">
            {lang === "de"
              ? "Marktpreise folgen, sobald die BrickLink-Anbindung diese Figur erfasst hat."
              : "Market prices will appear once the BrickLink connection has captured this figure."}
          </p>
        </div>
      )}
    </section>
  );
}
