# Brickonaut — Projekt-Briefing

> Markenname: **Brickonaut** (brickonaut.com war am 05.07.2026 frei — registrieren!).
> Projektordner heißt historisch weiterhin `bricktopia`, interne Storage-Keys ebenso.

Das LEGO-Portal für Sammler: Set-Lexikon, Minifiguren-Datenbank, Preisentwicklungen,
EOL-Radar, Leaks & Deals, Artikel und LEGO-City-Inspiration. Zweisprachig (DE/EN).

## Phasen

- **Phase 1 (fertig):** Stabile UI-Basis mit Next.js 16 + Tailwind, komplettes Seitengerüst,
  kuratierte Daten (49 Sets/29 Figuren, als Schätzwerte gekennzeichnet), DE/EN-Umschalter,
  Preis-Charts (recharts), U-Bahn-Erlebnis-Animation, Mock-Registrierung.
- **Phase 1.5 (fertig):** Voll-Katalog ALLER LEGO-Sets (27k+, Rebrickable-Dumps) mit
  serverseitiger Suche/Pagination (`/api/catalog/search`), Katalog-Steckbriefe für jedes Set,
  Preis-Layer pro Land & Quelle (`/api/prices/[setId]`, BrickLink-Live-Adapter wartet auf
  API-Keys, bis dahin Demo-Modell), täglicher Katalog-Sync-Agent (Scheduled Task 08:00,
  `npm run sync-catalog`, erkennt neue Sets automatisch).
- **Phase 1.6 (fertig):** Rebranding auf Brickonaut; Minifiguren-Vollkatalog (17k+ Figuren,
  `npm run sync-minifigs`, Suche + Steckbriefe + Set-Zuordnung); Rubrik "Legenden"
  (`/legenden`); Jahrgänge-Browser (`/jahrgaenge` → Lexikon-Jahresfilter); Kauf-Links pro
  Set (LEGO/Amazon/eBay/BrickLink/idealo, länderabhängig); Quell-/Angebots-Links im
  Leaks-Feed; Portfolio-Karte im Profil; PWA (Manifest + Icons, installierbar);
  WhatsApp-Button schaltet live via NEXT_PUBLIC_WHATSAPP_CHANNEL_URL (.env.example).
- **Phase 2:** Echte Datenbank (z. B. Postgres/Supabase), echte Auth, BrickLink-API-Keys
  (Preis-Guide live), eBay-Marketplace-Insights-Zugang, Locale-Routing (/de, /en) für SEO,
  Preis-Alerts, Service Worker/Capacitor für Stores.
- **Phase 3:** Leak-/Deal-Bot live an WhatsApp-Kanal, weitere Social-Kanäle, Community.

## Seitenstruktur

| Route | Inhalt |
|---|---|
| `/` | Home: Hero, Suche, Highlights, EOL-Teaser, Leaks-Teaser |
| `/lexikon` | Set-Datenbank mit Suche + Filter (Thema, Jahr, Kategorie, Verfügbarkeit) |
| `/lexikon/[setId]` | Steckbrief: Release, EOL, UVP, heutige Preise, Part-Out-Value, Preis-Chart, Investment-Score, enthaltene Minifiguren |
| `/minifiguren` | Minifiguren-Datenbank mit Suche + Filter |
| `/minifiguren/[figId]` | Figur-Steckbrief: Sets, Erstjahr, Seltenheit, Preise, Chart |
| `/eol-radar` | Aktuell verfügbare Sets mit EOL-Prognose |
| `/leaks` | Leaks-, News- & Deals-Feed + WhatsApp-Kanal-Banner |
| `/artikel`, `/artikel/[slug]` | Info-Artikel (Vintage, Retro, Neuheiten, Investment, City, Wissen) |
| `/city-hub` | LEGO-City-Ideen, Layouts, MOC-Tipps |
| `/erlebnis/u-bahn` | First-Person-Animation: Fahrt in einer LEGO-U-Bahn |
| `/registrieren`, `/login`, `/profil` | Mock-Auth + BrickLink-Store-Verknüpfung (UI) |
| `/portfolio` | Sammlungs-Portfolio: Sets hinzufügen (Anzahl, Zustand, Kaufpreis), heutiger Wert nach Land/Quelle, Gewinn/Verlust, Verteilungs-Donut. Pro Benutzer im localStorage (`bricktopia.portfolio.<username>`). |

## Design-Tokens (CSS-Variablen in `src/app/globals.css`)

Dunkles "Nacht über der LEGO-Stadt"-Theme mit LEGO-Farbakzenten:
`--bg` #0a0e1a · `--surface` #121829 · `--surface-2` #1a2138 · `--border` #232c47 ·
`--yellow` #f6c700 · `--red` #d01012 · `--blue` #2a6fd6 · `--green` #23a45c ·
`--text` #f2f4fb · `--muted` #94a0bd
Utility-Klassen: `.card`, `.badge`, `.btn`, `.btn-primary`, `.stud-row`.

## Datenverträge

Alle Inhalte liegen als typisierte TS-Daten in `src/data/`:
- `types.ts` — **Schema, nicht ändern.**
- `sets.ts` → `export const SETS: LegoSet[]`
- `minifigs.ts` → `export const MINIFIGS: Minifig[]`
- `leaks.ts` → `export const LEAKS: LeakPost[]`
- `articles.ts` → `export const ARTICLES: Article[]`
- `cityhub.ts` → `export const CITY_IDEAS: CityIdea[]`

i18n: Texte immer als `{ de, en }` (`LocalizedString`). UI-Strings über `useT()` aus
`src/lib/i18n.tsx`, Content über `pick(ls, lang)`.

## Regeln für Agenten

1. Nur die dir zugewiesenen Dateien anfassen. Shared Files (layout, globals.css, Header,
   types.ts) gehören der Projektleitung.
2. Nach der Arbeit `npx tsc --noEmit` im Projektordner laufen lassen. Fehler in fremden
   Dateien ignorieren (parallele Arbeit), eigene Dateien müssen fehlerfrei sein.
3. Preise/Daten sind recherchierte Schätzwerte (Stand Juli 2026) — plausibel, konsistent,
   EUR. Keine erfundenen Quellenangaben.
4. Bilder: Sets `https://images.brickset.com/sets/images/{setnr}-1.jpg`,
   Minifiguren `https://img.bricklink.com/ItemImage/MN/0/{figId}.png` (Fallback existiert im UI).
