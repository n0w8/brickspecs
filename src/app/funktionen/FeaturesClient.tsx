"use client";

// Funktionsübersicht: was BrickSpecs alles kann, mit Direktlinks.
// Redaktionell gepflegt - neue Features hier ergänzen.

import Link from "next/link";
import { useLang } from "@/lib/i18n";

interface Feature {
  emoji: string;
  href: string;
  title: { de: string; en: string };
  desc: { de: string; en: string };
  badge?: { de: string; en: string };
}

const GROUPS: { heading: { de: string; en: string }; features: Feature[] }[] = [
  {
    heading: { de: "Datenbank & Wissen", en: "Database & knowledge" },
    features: [
      {
        emoji: "🧱",
        href: "/lexikon",
        title: { de: "Set-Lexikon", en: "Set encyclopedia" },
        desc: {
          de: "Über 27.000 LEGO-Sets - jedes je erschienene Set mit Steckbrief, Bild, Teilezahl, Theme und Jahrgang. Wird täglich automatisch aktualisiert.",
          en: "Over 27,000 LEGO sets - every set ever released with profile, image, part count, theme and year. Updated automatically every day.",
        },
      },
      {
        emoji: "👤",
        href: "/minifiguren",
        title: { de: "Minifiguren-Datenbank", en: "Minifigure database" },
        desc: {
          de: "Über 17.000 Minifiguren mit Bild und Set-Zuordnung: Du siehst zu jeder Figur, in welchen Sets sie steckt - und zu jedem Set seine Figuren.",
          en: "Over 17,000 minifigures with image and set mapping: see which sets a figure appears in - and every set's figures.",
        },
      },
      {
        emoji: "🏆",
        href: "/legenden",
        title: { de: "Legendäre Sets", en: "Legendary sets" },
        desc: {
          de: "Kuratierte Steckbriefe der wichtigsten Sammler-Sets mit Preishistorie, Wertentwicklung und Investment-Einschätzung.",
          en: "Curated profiles of the most important collector sets with price history, value growth and investment rating.",
        },
      },
      {
        emoji: "📅",
        href: "/jahrgaenge",
        title: { de: "Jahrgänge", en: "Years" },
        desc: {
          de: "Alle Sets nach Erscheinungsjahr - von 1949 bis zu den angekündigten Neuheiten der Zukunft.",
          en: "All sets by release year - from 1949 to announced future releases.",
        },
      },
      {
        emoji: "🚀",
        href: "/neuheiten",
        title: { de: "Neuheiten-Radar", en: "New releases radar" },
        desc: {
          de: "Angekündigte und geleakte kommende Sets mit Quelle und Status (bestätigt oder Gerücht).",
          en: "Announced and leaked upcoming sets with source and status (confirmed or rumor).",
        },
      },
      {
        emoji: "📰",
        href: "/artikel",
        title: { de: "Artikel & Guides", en: "Articles & guides" },
        desc: {
          de: "Hintergrundwissen für Sammler: Vintage, Retro, Investment-Strategien und mehr.",
          en: "Background knowledge for collectors: vintage, retro, investment strategies and more.",
        },
      },
    ],
  },
  {
    heading: { de: "Preise & Investment", en: "Prices & investing" },
    features: [
      {
        emoji: "💶",
        href: "/lexikon",
        title: { de: "Preise nach Land & Quelle", en: "Prices by country & source" },
        desc: {
          de: "Durchschnittspreise (neu und gebraucht) für 10 Länder, wählbar nach Quelle - direkt auf jeder Set-Seite, mit Kauf-Links zu LEGO, Amazon, eBay, BrickLink und idealo.",
          en: "Average prices (new and used) for 10 countries, selectable by source - on every set page, with buy links to LEGO, Amazon, eBay, BrickLink and idealo.",
        },
      },
      {
        emoji: "⏳",
        href: "/eol-radar",
        title: { de: "EOL-Radar", en: "EOL radar" },
        desc: {
          de: "Welche Sets bald aus dem Sortiment fliegen (End of Life) - mit Prognose-Zeitfenster. Kurz vor EOL kaufen, nach EOL profitieren.",
          en: "Which sets are about to retire (end of life) - with forecast windows. Buy before EOL, profit after.",
        },
      },
      {
        emoji: "📁",
        href: "/portfolio",
        title: { de: "Portfolio", en: "Portfolio" },
        desc: {
          de: "Deine Sammlung als Depot: Sets mit Kaufpreis erfassen und Gesamtwert samt Wertentwicklung auf einen Blick verfolgen.",
          en: "Your collection as a portfolio: add sets with purchase price and track total value and growth at a glance.",
        },
      },
      {
        emoji: "🔔",
        href: "/preisalarm",
        title: { de: "Preisalarme", en: "Price alerts" },
        desc: {
          de: "Wunschpreis setzen und benachrichtigt werden, wenn ein Set dein Ziel erreicht.",
          en: "Set a target price and get notified when a set reaches your goal.",
        },
      },
    ],
  },
  {
    heading: { de: "Scanner", en: "Scanners" },
    features: [
      {
        emoji: "📸",
        href: "/scanner",
        title: { de: "Foto-Scanner", en: "Photo scanner" },
        desc: {
          de: "Set oder Minifigur fotografieren - BrickSpecs erkennt es und führt dich direkt zum Steckbrief. Fotos werden nirgends gespeichert.",
          en: "Photograph a set or minifig - BrickSpecs recognizes it and takes you straight to its profile. Photos are never stored.",
        },
      },
      {
        emoji: "🎁",
        href: "/box-scanner",
        title: { de: "Box-Code-Scanner", en: "Box code scanner" },
        desc: {
          de: "Den Code auf Minifiguren-Blind-Boxes scannen und sofort sehen, welche Figur drinsteckt - komplett im Browser, ohne App.",
          en: "Scan the code on minifigure blind boxes and instantly see which figure is inside - fully in your browser, no app.",
        },
      },
    ],
  },
  {
    heading: { de: "Deals, Leaks & Alarm-Kanäle", en: "Deals, leaks & alert channels" },
    features: [
      {
        emoji: "💸",
        href: "/leaks",
        title: { de: "Leaks & Deals-Feed", en: "Leaks & deals feed" },
        desc: {
          de: "Ein Wächter prüft alle 5 Minuten die großen LEGO-News-Quellen und sammelt Deals, Leaks und Aktionen an einem Ort.",
          en: "A watcher checks the major LEGO news sources every 5 minutes and collects deals, leaks and promos in one place.",
        },
      },
      {
        emoji: "🎁",
        href: "/",
        title: { de: "GWP-Übersicht", en: "GWP overview" },
        desc: {
          de: "Aktuelle Gratis-Beigaben (Gifts with Purchase) mit Countdown, Bedingungen und Detailseiten - direkt auf der Startseite.",
          en: "Current gifts with purchase with countdown, conditions and detail pages - right on the home page.",
        },
      },
      {
        emoji: "✈️",
        href: "https://t.me/brickspecs",
        title: { de: "Telegram-Alarm", en: "Telegram alerts" },
        desc: {
          de: "Deals, Leaks und GWPs sofort als Telegram-Nachricht - strukturiert mit Preis, Rabatt, Shop und Link.",
          en: "Deals, leaks and GWPs instantly as Telegram messages - structured with price, discount, shop and link.",
        },
      },
      {
        emoji: "📬",
        href: "/",
        title: { de: "E-Mail-Newsletter", en: "E-mail newsletter" },
        desc: {
          de: "Der tägliche BrickSpecs Alarm: neue Deals, Beigaben und Leaks bequem per Mail.",
          en: "The daily BrickSpecs alert: new deals, gifts and leaks conveniently by mail.",
        },
      },
    ],
  },
  {
    heading: { de: "Komfort", en: "Comfort" },
    features: [
      {
        emoji: "📱",
        href: "/",
        title: { de: "Als App installierbar", en: "Installable as an app" },
        desc: {
          de: "BrickSpecs ist eine PWA: über 'Zum Home-Bildschirm hinzufügen' verhält sich die Seite wie eine App - inklusive Kamera-Scanner.",
          en: "BrickSpecs is a PWA: via 'Add to home screen' the site behaves like an app - camera scanner included.",
        },
      },
      {
        emoji: "🌍",
        href: "/",
        title: { de: "Deutsch & Englisch", en: "German & English" },
        desc: {
          de: "Die komplette Seite ist zweisprachig - umschaltbar mit einem Klick oben rechts.",
          en: "The whole site is bilingual - switchable with one click at the top right.",
        },
      },
      {
        emoji: "📚",
        href: "/buecher-merch",
        title: { de: "Bücher & Merch", en: "Books & merch" },
        desc: {
          de: "Handverlesene Bücher, Spiele, Aufbewahrung und Fan-Artikel rund um LEGO.",
          en: "Hand-picked books, games, storage and fan merch around LEGO.",
        },
      },
      {
        emoji: "🏙️",
        href: "/city-hub",
        title: { de: "City-Hub", en: "City hub" },
        desc: {
          de: "Inspiration und Ideen für den Bau deiner eigenen LEGO-Stadt.",
          en: "Inspiration and ideas for building your own LEGO city.",
        },
      },
      {
        emoji: "💬",
        href: "/feedback",
        title: { de: "Feedback & Vorschläge", en: "Feedback & suggestions" },
        desc: {
          de: "Fehler gefunden oder eine Idee für BrickSpecs? Über das Feedback-Formular erreicht uns deine Nachricht direkt.",
          en: "Found a bug or have an idea for BrickSpecs? The feedback form sends your message straight to us.",
        },
      },
      {
        emoji: "🎬",
        href: "/partner",
        title: { de: "Creator-Programm", en: "Creator program" },
        desc: {
          de: "Für LEGO-YouTuber und -Creator: kostenloser Investor-Zugang, Empfehlungslink mit Umsatzbeteiligung und Vorstellung auf der Partner-Seite.",
          en: "For LEGO YouTubers and creators: free Investor access, referral link with revenue share and a feature on the partner page.",
        },
      },
    ],
  },
];

export default function FeaturesClient() {
  const { lang } = useLang();

  return (
    <div className="mx-auto max-w-5xl px-1 pt-14 pb-20">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
          {lang === "de" ? "Was BrickSpecs alles kann" : "Everything BrickSpecs can do"}
        </h1>
        <p className="text-[var(--muted)] max-w-2xl mx-auto">
          {lang === "de"
            ? "Die größte frei zugängliche LEGO-Wissensbasis: Katalog, Preise, Scanner und Alarm-Kanäle - alles an einem Ort, täglich automatisch aktualisiert."
            : "The largest freely accessible LEGO knowledge base: catalog, prices, scanners and alert channels - all in one place, updated automatically every day."}
        </p>
      </div>

      <div className="flex flex-col gap-12">
        {GROUPS.map((group) => (
          <section key={group.heading.en}>
            <h2 className="text-xl font-extrabold mb-4">{group.heading[lang]}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.features.map((f) => {
                const external = f.href.startsWith("http");
                const inner = (
                  <>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-2xl" aria-hidden>
                        {f.emoji}
                      </span>
                      <span className="font-bold">{f.title[lang]}</span>
                    </div>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">{f.desc[lang]}</p>
                  </>
                );
                return external ? (
                  <a
                    key={f.title.en}
                    href={f.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card card-hover p-5"
                  >
                    {inner}
                  </a>
                ) : (
                  <Link key={f.title.en} href={f.href} className="card card-hover p-5">
                    {inner}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="text-center mt-14">
        <p className="text-[var(--muted)] mb-4">
          {lang === "de"
            ? "Mehr Limits, mehr Daten, mehr Alarme?"
            : "More limits, more data, more alerts?"}
        </p>
        <Link href="/preise" className="btn btn-primary">
          💎 {lang === "de" ? "Pläne ansehen" : "View plans"}
        </Link>
      </div>
    </div>
  );
}
