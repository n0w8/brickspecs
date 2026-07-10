"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, useT, type UIKey } from "@/lib/i18n";

const NAV: { href: string; key: UIKey }[] = [
  { href: "/lexikon", key: "nav.lexicon" },
  { href: "/minifiguren", key: "nav.minifigs" },
  { href: "/neuheiten", key: "nav.upcoming" },
  { href: "/legenden", key: "nav.legends" },
  { href: "/jahrgaenge", key: "nav.years" },
  { href: "/buecher-merch", key: "nav.gear" },
  { href: "/eol-radar", key: "nav.eol" },
  { href: "/leaks", key: "nav.leaks" },
  { href: "/artikel", key: "nav.articles" },
  { href: "/city-hub", key: "nav.city" },
  { href: "/portfolio", key: "nav.portfolio" },
  { href: "/scanner", key: "nav.scanner" },
  { href: "/preise", key: "nav.pricing" },
];

export default function Header() {
  const { lang, setLang } = useLang();
  const t = useT();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(10,14,26,0.92)] backdrop-blur">
      <div className="stud-row" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* Logo: Brick mit Brille = BrickSpecs (specs = Datenblatt UND Brille) */}
            <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0" aria-hidden>
              <rect x="2" y="2" width="60" height="60" rx="14" fill="#d01012" />
              <rect x="18" y="13" width="11" height="9" rx="2.5" fill="#f6c700" />
              <rect x="35" y="13" width="11" height="9" rx="2.5" fill="#f6c700" />
              <rect x="13" y="21" width="38" height="28" rx="5" fill="#f6c700" />
              <rect x="13" y="32.5" width="5" height="3" fill="#0a0e1a" />
              <rect x="46" y="32.5" width="5" height="3" fill="#0a0e1a" />
              <rect x="28" y="32.5" width="8" height="3" fill="#0a0e1a" />
              <circle cx="24" cy="34" r="6.5" fill="#0a0e1a" />
              <circle cx="40" cy="34" r="6.5" fill="#0a0e1a" />
              <circle cx="22" cy="32" r="2" fill="#2a6fd6" />
              <circle cx="38" cy="32" r="2" fill="#2a6fd6" />
              <rect x="27" y="43" width="10" height="2.5" rx="1.25" fill="#c79f00" />
            </svg>
            <span className="text-lg font-800 font-bold tracking-tight">
              Brick<span className="text-[var(--yellow)]">Specs</span>
            </span>
            <span className="badge badge-gray hidden sm:inline-flex">beta</span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs font-bold">
              {(["de", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1.5 uppercase cursor-pointer transition-colors ${
                    lang === l
                      ? "bg-[var(--yellow)] text-[#16130a]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <Link href="/profil" className="btn !py-1.5 !px-3 text-sm">
              👤 <span className="hidden md:inline">{t("nav.profile")}</span>
            </Link>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto scroll-thin pb-2 -mx-1 px-1">
          {NAV.map(({ href, key }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`chip ${active ? "chip-active" : ""}`}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
