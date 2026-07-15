"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

interface Part {
  id: string;
  name: string;
  color: string;
  qty: number;
  img: string | null;
  partNum: string;
}

interface PartsData {
  available: boolean;
  total?: number;
  parts?: Part[];
}

const INITIAL = 60;

/**
 * Teileliste eines Sets + Teile-Kauf-Links. catalogId ist die Rebrickable-
 * Setnummer im "-1"-Format ("6552-1"), setNumber die Basisnummer fuer BrickLink.
 *
 * Zeigt (falls REBRICKABLE_API_KEY hinterlegt) ein kompaktes Grid der Teile;
 * ohne Key erscheint nur ein Hinweis auf die Rebrickable-Teileseite. Die
 * Teile-Kauf-Links (BrickLink Part-Out, Rebrickable) werden IMMER angezeigt.
 */
export default function PartsList({
  catalogId,
  setNumber,
}: {
  catalogId: string;
  setNumber: string;
}) {
  const { lang } = useLang();
  const [data, setData] = useState<PartsData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (firedFor.current === catalogId) return;
    firedFor.current = catalogId;

    let cancelled = false;
    fetch(`/api/sets/${encodeURIComponent(catalogId)}/parts`)
      .then((r) => r.json())
      .then((json: PartsData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ available: false });
      });
    return () => {
      cancelled = true;
    };
  }, [catalogId]);

  const baseNumber = setNumber.replace(/-\d+$/, "");
  const bricklinkPartOut = `https://www.bricklink.com/catalogPG.asp?S=${encodeURIComponent(baseNumber)}`;
  const rebrickableParts = `https://rebrickable.com/sets/${encodeURIComponent(catalogId)}/#parts`;

  const parts = data?.available ? (data.parts ?? []) : [];
  const total = data?.total ?? parts.length;
  const shown = expanded ? parts : parts.slice(0, INITIAL);
  const rest = total - shown.length;

  return (
    <section className="card p-5">
      <h2 className="font-bold text-lg mb-4">
        🧩{" "}
        {data?.available
          ? lang === "de"
            ? `Teile in diesem Set (${total.toLocaleString("de-DE")})`
            : `Parts in this set (${total.toLocaleString("en-GB")})`
          : lang === "de"
            ? "Teile in diesem Set"
            : "Parts in this set"}
      </h2>

      {data?.available && parts.length > 0 ? (
        <>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2"
              >
                {p.img ? (
                  // eslint-disable-next-line @next/next/no-img-element -- kleine CDN-Thumbnails
                  <img
                    src={p.img}
                    alt={p.name}
                    className="h-10 w-10 shrink-0 rounded object-contain bg-white/90"
                    loading="lazy"
                  />
                ) : (
                  <span className="h-10 w-10 shrink-0 rounded bg-[var(--surface)]" aria-hidden />
                )}
                <div className="min-w-0 flex flex-col">
                  <span className="font-semibold text-sm leading-tight">
                    {p.qty}× <span className="font-normal">{p.name}</span>
                  </span>
                  {p.color && (
                    <span className="text-xs text-[var(--muted)] truncate">{p.color}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {rest > 0 && !expanded && (
            <button
              className="btn mt-4"
              onClick={() => setExpanded(true)}
            >
              {lang === "de" ? `+ ${rest} weitere anzeigen` : `Show ${rest} more`}
            </button>
          )}
          {data.total !== undefined && data.total > parts.length && (
            <p className="text-xs text-[var(--muted)] mt-3">
              {lang === "de"
                ? `Es werden ${parts.length.toLocaleString("de-DE")} von ${total.toLocaleString("de-DE")} Teilesorten gezeigt - die vollstaendige Liste bei Rebrickable.`
                : `Showing ${parts.length.toLocaleString("en-GB")} of ${total.toLocaleString("en-GB")} part types - see the full list on Rebrickable.`}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          <a
            href={rebrickableParts}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--yellow)] underline decoration-dotted underline-offset-4"
          >
            {lang === "de"
              ? "Vollstaendige Teileliste bei Rebrickable ansehen ↗"
              : "View the full parts list on Rebrickable ↗"}
          </a>
        </p>
      )}

      {/* Teile kaufen - immer sichtbar */}
      <div className="mt-5 pt-4 border-t border-[var(--border)]">
        <p className="text-sm font-semibold mb-2">
          🛒 {lang === "de" ? "Teile kaufen" : "Buy parts"}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={bricklinkPartOut}
            target="_blank"
            rel="noopener noreferrer"
            className="chip hover:!border-[var(--yellow)]"
          >
            BrickLink Part-Out ↗
          </a>
        </div>
      </div>
    </section>
  );
}
