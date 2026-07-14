"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UPCOMING, type UpcomingSet } from "@/data/upcoming";
import { pick, useLang } from "@/lib/i18n";
import { formatEUR } from "@/lib/format";

/** Sortierschlüssel für Release-Fenster: "YYYY-MM" < "H1 YYYY" < "YYYY" < "H2 YYYY" < "Ende YYYY". */
function windowSortKey(window: string): number {
  const month = /^(\d{4})-(\d{2})$/.exec(window);
  if (month) return Number(month[1]) * 1000 + Number(month[2]) * 10;
  const half = /^H([12]) (\d{4})$/.exec(window);
  if (half) return Number(half[2]) * 1000 + (half[1] === "1" ? 65 : 95);
  const late = /^Ende (\d{4})$/.exec(window);
  if (late) return Number(late[1]) * 1000 + 115;
  const year = /^(\d{4})$/.exec(window);
  if (year) return Number(year[1]) * 1000 + 70;
  return 9999999;
}

function windowLabel(window: string, lang: "de" | "en"): string {
  const month = /^(\d{4})-(\d{2})$/.exec(window);
  if (month) {
    return new Date(Number(month[1]), Number(month[2]) - 1, 1).toLocaleDateString(
      lang === "de" ? "de-DE" : "en-GB",
      { month: "long", year: "numeric" }
    );
  }
  const late = /^Ende (\d{4})$/.exec(window);
  if (late) return lang === "de" ? `Ende ${late[1]}` : `Late ${late[1]}`;
  if (/^\d{4}$/.test(window)) {
    return lang === "de" ? `${window} (Fenster offen)` : `${window} (window TBD)`;
  }
  return window;
}

type StatusFilter = "all" | UpcomingSet["status"];

export default function NeuheitenClient({
  profileLinks,
}: {
  /**
   * Upcoming-Set-ID → gültige Lexikon-Route (z. B. "/lexikon/75455-1").
   * Wird serverseitig gegen den Katalog geprüft - Sets ohne Eintrag bekommen
   * bewusst KEINEN Steckbrief-Link (sonst 404).
   */
  profileLinks: Record<string, string>;
}) {
  const { lang } = useLang();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [theme, setTheme] = useState<string>("all");

  const themes = useMemo(
    () => [...new Set(UPCOMING.map((s) => s.theme))].sort((a, b) => a.localeCompare(b)),
    []
  );

  const groups = useMemo(() => {
    const filtered = UPCOMING.filter(
      (s) => (status === "all" || s.status === status) && (theme === "all" || s.theme === theme)
    );
    const byWindow = new Map<string, UpcomingSet[]>();
    for (const set of filtered) {
      const list = byWindow.get(set.window) ?? [];
      list.push(set);
      byWindow.set(set.window, list);
    }
    return [...byWindow.entries()]
      .sort((a, b) => windowSortKey(a[0]) - windowSortKey(b[0]))
      .map(([window, sets]) => ({
        window,
        sets: sets.sort(
          (a, b) => a.theme.localeCompare(b.theme) || pick(a.name, lang).localeCompare(pick(b.name, lang))
        ),
      }));
  }, [status, theme, lang]);

  const confirmedCount = UPCOMING.filter((s) => s.status === "confirmed").length;
  const rumorCount = UPCOMING.length - confirmedCount;

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">
          🚀 {lang === "de" ? "Neuheiten-Radar" : "New Release Radar"}
        </h1>
        <p className="text-[var(--muted)] max-w-2xl">
          {lang === "de"
            ? "Alle angekündigten und geleakten Sets bis Ende 2027 - recherchiert und laufend gepflegt."
            : "All announced and leaked sets through the end of 2027 - researched and continuously maintained."}
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button className={`chip ${status === "all" ? "chip-active" : ""}`} onClick={() => setStatus("all")}>
          {lang === "de" ? "Alle" : "All"} ({UPCOMING.length})
        </button>
        <button
          className={`chip ${status === "confirmed" ? "chip-active" : ""}`}
          onClick={() => setStatus("confirmed")}
        >
          ✅ {lang === "de" ? "Bestätigt" : "Confirmed"} ({confirmedCount})
        </button>
        <button
          className={`chip ${status === "rumor" ? "chip-active" : ""}`}
          onClick={() => setStatus("rumor")}
        >
          🔮 {lang === "de" ? "Gerücht" : "Rumor"} ({rumorCount})
        </button>
        <select
          className="input !w-auto ml-auto"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          aria-label={lang === "de" ? "Thema" : "Theme"}
        >
          <option value="all">{lang === "de" ? "Alle Themen" : "All themes"}</option>
          {themes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Gruppen nach Release-Fenster */}
      {groups.length === 0 && (
        <p className="text-[var(--muted)]">
          {lang === "de" ? "Keine Einträge für diese Filter." : "No entries for these filters."}
        </p>
      )}
      {groups.map(({ window, sets }) => (
        <section key={window} className="flex flex-col gap-3">
          <h2 className="text-xl font-bold border-b border-[var(--border)] pb-2">
            📅 {windowLabel(window, lang)}{" "}
            <span className="text-sm font-normal text-[var(--muted)]">
              ({sets.length} {lang === "de" ? (sets.length === 1 ? "Set" : "Sets") : sets.length === 1 ? "set" : "sets"})
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sets.map((set) => (
              <article key={set.id} className="card p-5 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`badge ${set.status === "confirmed" ? "badge-green" : "badge-gray"}`}>
                    {set.status === "confirmed"
                      ? lang === "de" ? "Bestätigt" : "Confirmed"
                      : lang === "de" ? "Gerücht" : "Rumor"}
                  </span>
                  <span className="badge badge-blue">{set.theme}</span>
                  {set.setNumber && <span className="badge badge-yellow">#{set.setNumber}</span>}
                  <span className="text-[var(--muted)] ml-auto">
                    {lang === "de" ? "Quelle" : "Source"}: {set.source}
                  </span>
                </div>
                <h3 className="font-bold text-lg leading-snug">{pick(set.name, lang)}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                  <span>
                    {lang === "de" ? "Erw. Preis" : "Exp. price"}:{" "}
                    <strong className="text-[#c7cede]">
                      {set.expectedPriceEUR !== null ? formatEUR(set.expectedPriceEUR, lang) : "-"}
                    </strong>
                  </span>
                  <span>
                    {lang === "de" ? "Teile" : "Pieces"}:{" "}
                    <strong className="text-[#c7cede]">
                      {set.pieces !== null ? set.pieces.toLocaleString(lang === "de" ? "de-DE" : "en-GB") : "-"}
                    </strong>
                  </span>
                </div>
                <p className="text-sm text-[#c7cede] leading-relaxed">{pick(set.description, lang)}</p>
                {profileLinks[set.id] && (
                  <div className="mt-auto pt-2">
                    <Link href={profileLinks[set.id]} className="btn !py-1.5 !px-3 text-sm">
                      {lang === "de" ? "Zum Steckbrief" : "View set profile"} →
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-[var(--muted)]">
        {lang === "de"
          ? "Hinweis: Gerüchte sind unbestätigte Informationen aus der Fan-Community. Setnummern, Namen, Preise und Termine können sich bis zur offiziellen Ankündigung ändern."
          : "Note: rumors are unconfirmed information from the fan community. Set numbers, names, prices and dates can change until the official announcement."}
      </p>
    </div>
  );
}
