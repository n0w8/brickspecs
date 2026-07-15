"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Lang, LocalizedString } from "@/data/types";

const STORAGE_KEY = "bricktopia.lang";

const LangContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({ lang: "de", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("de");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "de" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

/** Wählt die passende Sprachvariante aus einem LocalizedString. */
export function pick(ls: LocalizedString, lang: Lang): string {
  return ls[lang];
}

/* ---------- UI-Wörterbuch ---------- */

export const UI = {
  "nav.home": { de: "Start", en: "Home" },
  "nav.lexicon": { de: "Set-Lexikon", en: "Set Encyclopedia" },
  "nav.minifigs": { de: "Minifiguren", en: "Minifigures" },
  "nav.eol": { de: "EOL-Radar", en: "EOL Radar" },
  "nav.leaks": { de: "Leaks & Deals", en: "Leaks & Deals" },
  "nav.articles": { de: "Artikel", en: "Articles" },
  "nav.city": { de: "City-Hub", en: "City Hub" },
  "nav.portfolio": { de: "Portfolio", en: "Portfolio" },
  "nav.scanner": { de: "Scanner", en: "Scanner" },
  "nav.pricing": { de: "Preise & Pläne", en: "Pricing" },
  "nav.legends": { de: "Legenden", en: "Legends" },
  "nav.years": { de: "Jahrgänge", en: "Years" },
  "nav.upcoming": { de: "Neuheiten", en: "New releases" },
  "nav.gear": { de: "Bücher & Merch", en: "Books & Merch" },
  "nav.login": { de: "Anmelden", en: "Log in" },
  "nav.register": { de: "Registrieren", en: "Sign up" },
  "nav.profile": { de: "Profil", en: "Profile" },

  "common.search": { de: "Suchen …", en: "Search …" },
  "common.all": { de: "Alle", en: "All" },
  "common.theme": { de: "Thema", en: "Theme" },
  "common.year": { de: "Jahr", en: "Year" },
  "common.category": { de: "Kategorie", en: "Category" },
  "common.availability": { de: "Verfügbarkeit", en: "Availability" },
  "common.pieces": { de: "Teile", en: "Pieces" },
  "common.minifigs": { de: "Minifiguren", en: "Minifigures" },
  "common.rrp": { de: "UVP damals", en: "Original RRP" },
  "common.valueNew": { de: "Wert heute (neu)", en: "Value today (new)" },
  "common.valueUsed": { de: "Wert heute (gebraucht)", en: "Value today (used)" },
  "common.partOut": { de: "Part-Out-Value", en: "Part-out value" },
  "common.release": { de: "Release", en: "Released" },
  "common.eol": { de: "EOL", en: "EOL" },
  "common.rarity": { de: "Seltenheit", en: "Rarity" },
  "common.firstYear": { de: "Erstes Jahr", en: "First year" },
  "common.appearsIn": { de: "Kommt vor in", en: "Appears in" },
  "common.results": { de: "Treffer", en: "results" },
  "common.noResults": { de: "Keine Treffer - Filter anpassen.", en: "No results - adjust your filters." },
  "common.readMore": { de: "Weiterlesen", en: "Read more" },
  "common.back": { de: "Zurück", en: "Back" },
  "common.priceChart": { de: "Preisentwicklung (neu/versiegelt)", en: "Price development (new/sealed)" },
  "common.estimates": { de: "Demo-Daten: recherchierte Schätzwerte, Stand Juli 2026.", en: "Demo data: researched estimates as of July 2026." },
  "common.investmentScore": { de: "Investment-Score", en: "Investment score" },
  "common.includedMinifigs": { de: "Enthaltene Minifiguren", en: "Included minifigures" },
  "common.minutes": { de: "Min. Lesezeit", en: "min read" },

  "avail.available": { de: "Verfügbar", en: "Available" },
  "avail.retiring-soon": { de: "EOL bald", en: "Retiring soon" },
  "avail.retired": { de: "Eingestellt", en: "Retired" },
  "cat.vintage": { de: "Vintage (vor 1995)", en: "Vintage (pre-1995)" },
  "cat.retro": { de: "Retro (1995-2010)", en: "Retro (1995-2010)" },
  "cat.modern": { de: "Modern (ab 2011)", en: "Modern (2011+)" },
  "rarity.common": { de: "Häufig", en: "Common" },
  "rarity.uncommon": { de: "Weniger häufig", en: "Uncommon" },
  "rarity.rare": { de: "Selten", en: "Rare" },
  "rarity.ultra-rare": { de: "Ultra-selten", en: "Ultra rare" },

  "home.heroTitle": { de: "Das Portal für LEGO-Sammler", en: "The portal for LEGO collectors" },
  "home.heroSub": {
    de: "Set-Lexikon, Minifiguren-Datenbank, Preisentwicklungen, EOL-Prognosen und blitzschnelle Leaks - alles an einem Ort.",
    en: "Set encyclopedia, minifigure database, price trends, EOL forecasts and lightning-fast leaks - all in one place.",
  },
  "home.searchPlaceholder": { de: "Set-Nummer oder Name suchen, z. B. 10188 …", en: "Search set number or name, e.g. 10188 …" },
  "home.featured": { de: "Legendäre Sets", en: "Legendary sets" },
  "home.eolTeaser": { de: "Bald EOL - jetzt noch zur UVP", en: "Retiring soon - still at RRP" },
  "home.latestLeaks": { de: "Frische Leaks & Deals", en: "Fresh leaks & deals" },
  "home.latestArticles": { de: "Neue Artikel", en: "Latest articles" },

  "leaks.whatsapp": { de: "WhatsApp-Kanal beitreten", en: "Join WhatsApp channel" },
  "leaks.whatsappSub": {
    de: "Unser Leak-Bot postet Leaks & Schnäppchen in Sekunden direkt in den Kanal.",
    en: "Our leak bot posts leaks & deals to the channel within seconds.",
  },

  "eol.title": { de: "EOL-Radar", en: "EOL Radar" },
  "eol.sub": {
    de: "Aktuell verfügbare Sets und wann sie voraussichtlich vom Markt gehen.",
    en: "Currently available sets and when they are expected to retire.",
  },
  "eol.window": { de: "Prognose-Fenster", en: "Forecast window" },
  "eol.confidence": { de: "Sicherheit", en: "Confidence" },
  "conf.low": { de: "niedrig", en: "low" },
  "conf.medium": { de: "mittel", en: "medium" },
  "conf.high": { de: "hoch", en: "high" },

  "auth.registerTitle": { de: "Konto erstellen", en: "Create account" },
  "auth.loginTitle": { de: "Anmelden", en: "Log in" },
  "auth.email": { de: "E-Mail", en: "Email" },
  "auth.password": { de: "Passwort", en: "Password" },
  "auth.username": { de: "Benutzername", en: "Username" },
  "auth.submitRegister": { de: "Registrieren", en: "Sign up" },
  "auth.submitLogin": { de: "Anmelden", en: "Log in" },
  "auth.demoNote": {
    de: "Demo-Modus: Konten werden nur lokal im Browser gespeichert. Echte Accounts folgen in Phase 2.",
    en: "Demo mode: accounts are stored locally in your browser. Real accounts arrive in phase 2.",
  },
  "auth.cloudNote": {
    de: "Dein Konto wird sicher gespeichert (Supabase, EU-Server in Frankfurt).",
    en: "Your account is stored securely (Supabase, EU servers in Frankfurt).",
  },
  "auth.confirmTitle": { de: "Fast geschafft!", en: "Almost there!" },
  "auth.confirmSent": {
    de: "Wir haben dir einen Bestätigungslink geschickt an",
    en: "We sent a confirmation link to",
  },
  "auth.confirmHint": {
    de: "Klicke auf den Link in der E-Mail, um dein Konto zu aktivieren. Schau auch im Spam-Ordner nach.",
    en: "Click the link in the email to activate your account. Also check your spam folder.",
  },
  "auth.working": { de: "Bitte warten ...", en: "Please wait ..." },
  "auth.callbackError": {
    de: "Der Bestätigungslink war ungültig oder abgelaufen - bitte melde dich an oder registriere dich erneut.",
    en: "The confirmation link was invalid or expired - please log in or sign up again.",
  },
  "profile.bricklink": { de: "BrickLink-Store verknüpfen", en: "Link BrickLink store" },
  "profile.bricklinkSub": {
    de: "Hinterlege deinen Store-Namen - die API-Anbindung folgt in Phase 2.",
    en: "Save your store name - the API connection arrives in phase 2.",
  },
  "profile.logout": { de: "Abmelden", en: "Log out" },

  "price.title": { de: "Durchschnittspreise nach Land & Quelle", en: "Average prices by country & source" },
  "price.country": { de: "Land", en: "Country" },
  "price.source": { de: "Quelle", en: "Source" },
  "price.bricklink": { de: "BrickLink", en: "BrickLink" },
  "price.ebay": { de: "eBay (verkaufte Angebote)", en: "eBay (sold listings)" },
  "price.new": { de: "Neu / versiegelt", en: "New / sealed" },
  "price.used": { de: "Gebraucht", en: "Used" },
  "price.samples": { de: "Datenpunkte", en: "data points" },
  "price.demoBadge": { de: "Demo-Modell", en: "Demo model" },
  "price.liveBadge": { de: "Live-Daten", en: "Live data" },
  "price.demoNote": {
    de: "Schätzmodell - echte BrickLink-/eBay-Anbindung aktiviert sich automatisch, sobald API-Keys hinterlegt sind.",
    en: "Estimation model - real BrickLink/eBay connection activates automatically once API keys are configured.",
  },
  "price.loading": { de: "Preise werden geladen …", en: "Loading prices …" },
  "price.none": { de: "Keine Preisdaten verfügbar.", en: "No price data available." },

  "lex.catalogCount": { de: "Sets im Komplett-Katalog", en: "sets in the full catalog" },
  "lex.updated": { de: "Katalog-Stand", en: "Catalog updated" },
  "lex.decade": { de: "Zeitraum", en: "Period" },
  "lex.sortNewest": { de: "Neueste zuerst", en: "Newest first" },
  "lex.sortOldest": { de: "Älteste zuerst", en: "Oldest first" },
  "lex.sortParts": { de: "Meiste Teile", en: "Most pieces" },
  "lex.sortName": { de: "Name A-Z", en: "Name A-Z" },
  "lex.curatedBadge": { de: "Steckbrief+", en: "Profile+" },
  "lex.prev": { de: "← Zurück", en: "← Previous" },
  "lex.next": { de: "Weiter →", en: "Next →" },
  "lex.pageOf": { de: "Seite", en: "Page" },
  "lex.of": { de: "von", en: "of" },
  "lex.searching": { de: "Suche läuft …", en: "Searching …" },
  "catalog.noEditorial": {
    de: "Für dieses Set liegen noch keine redaktionellen Daten (EOL-Prognose, Preishistorie, Beschreibung) vor - der Katalog-Agent pflegt Basisdaten und Foto automatisch.",
    en: "No editorial data (EOL forecast, price history, description) for this set yet - the catalog agent maintains base data and photo automatically.",
  },

  "pf.title": { de: "Mein Portfolio", en: "My Portfolio" },
  "pf.sub": {
    de: "Deine Sammlung im Blick: Einkaufswert, heutiger Marktwert und Wertentwicklung.",
    en: "Your collection at a glance: purchase value, current market value and performance.",
  },
  "pf.add": { de: "Zum Portfolio hinzufügen", en: "Add to portfolio" },
  "pf.inPortfolio": { de: "Im Portfolio", en: "In portfolio" },
  "pf.quantity": { de: "Anzahl", en: "Quantity" },
  "pf.condition": { de: "Zustand", en: "Condition" },
  "pf.purchasePrice": { de: "Kaufpreis / Stück", en: "Purchase price / unit" },
  "pf.note": { de: "Notiz (optional)", en: "Note (optional)" },
  "pf.save": { de: "Speichern", en: "Save" },
  "pf.remove": { de: "Entfernen", en: "Remove" },
  "pf.optional": { de: "optional", en: "optional" },
  "pf.invested": { de: "Investiert", en: "Invested" },
  "pf.currentValue": { de: "Heutiger Wert", en: "Current value" },
  "pf.gain": { de: "Gewinn / Verlust", en: "Gain / loss" },
  "pf.items": { de: "Sets", en: "sets" },
  "pf.units": { de: "Exemplare", en: "units" },
  "pf.perUnit": { de: "pro Stück", en: "per unit" },
  "pf.empty": {
    de: "Dein Portfolio ist noch leer. Öffne ein Set im Lexikon und füge es hinzu.",
    en: "Your portfolio is empty. Open a set in the encyclopedia and add it.",
  },
  "pf.emptyCta": { de: "Zum Set-Lexikon", en: "Go to encyclopedia" },
  "pf.loginNeeded": {
    de: "Für dein Portfolio musst du angemeldet sein.",
    en: "You need to be logged in to use your portfolio.",
  },
  "pf.allocation": { de: "Verteilung nach Wert", en: "Allocation by value" },
  "pf.investedHint": {
    de: "Gewinn bezieht sich nur auf Sets mit hinterlegtem Kaufpreis.",
    en: "Gain refers only to sets with a recorded purchase price.",
  },
  "pf.addedToast": { de: "Zum Portfolio hinzugefügt", en: "Added to portfolio" },
  "pf.quickAddValue": {
    de: "Marktwert wird pro Set nach Land & Quelle unten berechnet.",
    en: "Market value is computed per set by country & source below.",
  },

  "legends.title": { de: "Legendäre Sets", en: "Legendary sets" },
  "legends.sub": {
    de: "Die Sets, die Geschichte geschrieben haben - von der gelben Burg bis zum UCS-Falken. Kuratiert, mit Marktwert und Wertentwicklung.",
    en: "The sets that made history - from the Yellow Castle to the UCS Falcon. Curated, with market value and growth.",
  },
  "years.title": { de: "Jahrgänge", en: "Years" },
  "years.sub": {
    de: "Alle Sets nach Erscheinungsjahr - von den Anfängen bis heute. Klick auf ein Jahr öffnet das Lexikon mit dem passenden Filter.",
    en: "All sets by release year - from the very beginning until today. Click a year to open the encyclopedia with that filter.",
  },
  "years.setsIn": { de: "Sets", en: "sets" },
  "buy.title": { de: "Kaufen bei", en: "Buy at" },
  "buy.hint": {
    de: "Links öffnen die Suche/Produktseite beim jeweiligen Händler für dein gewähltes Land.",
    en: "Links open the search/product page at the retailer for your selected country.",
  },
  "leaks.toSource": { de: "Zur Quelle", en: "View source" },
  "leaks.toOffer": { de: "Zum Angebot", en: "View offer" },
  "leaks.whatsappPending": {
    de: "Kanal-Link wird eingerichtet - trag ihn in .env als NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ein.",
    en: "Channel link pending - set NEXT_PUBLIC_WHATSAPP_CHANNEL_URL in .env.",
  },
  "figs.catalogCount": { de: "Minifiguren im Komplett-Katalog", en: "minifigures in the full catalog" },
  "figs.curatedTitle": { de: "Legendäre Figuren", en: "Legendary figures" },
  "figs.noEditorial": {
    de: "Für diese Figur liegen noch keine redaktionellen Daten (Seltenheit, Preishistorie, Beschreibung) vor - Basisdaten und Foto pflegt der Katalog-Agent automatisch.",
    en: "No editorial data (rarity, price history, description) for this figure yet - base data and photo are maintained automatically by the catalog agent.",
  },
  "figs.searchPlaceholder": {
    de: "Figur suchen, z. B. Darth Vader oder fig-000123 …",
    en: "Search figure, e.g. Darth Vader or fig-000123 …",
  },
} as const;

export type UIKey = keyof typeof UI;

export function useT() {
  const { lang } = useLang();
  return useCallback((key: UIKey) => UI[key][lang], [lang]);
}
