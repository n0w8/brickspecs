// Zentrale Datenverträge für Bricktopia - NICHT ohne Absprache ändern.

export type Lang = "de" | "en";

export interface LocalizedString {
  de: string;
  en: string;
}

export type SetCategory = "vintage" | "retro" | "modern";
export type Availability = "available" | "retiring-soon" | "retired";

export interface PricePoint {
  /** Jahr des Messpunkts, z. B. 2019 */
  year: number;
  /** Durchschnittlicher Marktpreis (neu/versiegelt) in EUR */
  priceEUR: number;
}

export interface EolPrediction {
  /** Menschlich lesbares Fenster, z. B. "Ende 2026" */
  window: LocalizedString;
  /** Frühester Monat als ISO-String, z. B. "2026-10" */
  earliest: string;
  /** Spätester Monat als ISO-String, z. B. "2027-06" */
  latest: string;
  confidence: "low" | "medium" | "high";
  note?: LocalizedString;
}

export interface LegoSet {
  /** Setnummer, z. B. "10188" */
  id: string;
  name: LocalizedString;
  theme: string;
  subtheme?: string;
  /** Release-Jahr */
  year: number;
  /** EOL-Jahr, falls bereits eingestellt */
  eolYear?: number;
  pieces: number;
  minifigCount: number;
  /** Damalige UVP in EUR (ggf. umgerechnet), null wenn unbekannt */
  retailPriceEUR: number | null;
  /** Heutiger Marktwert neu/versiegelt in EUR */
  currentValueNewEUR: number | null;
  /** Heutiger Marktwert gebraucht in EUR */
  currentValueUsedEUR: number | null;
  /** BrickLink Part-Out-Value in EUR */
  partOutValueEUR: number | null;
  /** 4-8 Punkte Preisentwicklung (neu/versiegelt) */
  priceHistory: PricePoint[];
  availability: Availability;
  /** Nur für available/retiring-soon sinnvoll */
  eolPrediction?: EolPrediction;
  category: SetCategory;
  /** 2-4 Sätze Beschreibung */
  description: LocalizedString;
  /** IDs aus minifigs.ts, [] wenn keine */
  minifigIds: string[];
  imageUrl?: string;
  tags?: string[];
}

export interface Minifig {
  /** BrickLink-Style-ID, z. B. "sw0107" */
  id: string;
  name: LocalizedString;
  theme: string;
  /** Jahr des ersten Auftritts */
  firstYear: number;
  /** Setnummern, in denen die Figur vorkommt (auch Sets außerhalb von sets.ts erlaubt) */
  appearsInSetIds: string[];
  rarity: "common" | "uncommon" | "rare" | "ultra-rare";
  valueNewEUR: number | null;
  valueUsedEUR: number | null;
  priceHistory: PricePoint[];
  description: LocalizedString;
  imageUrl?: string;
}

export type ArticleCategory =
  | "vintage"
  | "retro"
  | "neuheiten"
  | "investment"
  | "city"
  | "wissen";

export interface Article {
  slug: string;
  title: LocalizedString;
  teaser: LocalizedString;
  category: ArticleCategory;
  /** ISO-Datum, z. B. "2026-07-01" */
  date: string;
  readingMinutes: number;
  /** Deko-Header: Emoji + CSS-Gradient */
  hero: { emoji: string; gradient: string };
  /** Absätze; Präfix "## " markiert eine Zwischenüberschrift */
  body: { de: string[]; en: string[] };
  relatedSetIds?: string[];
}

export interface LeakPost {
  id: string;
  type: "leak" | "deal" | "news";
  title: LocalizedString;
  body: LocalizedString;
  theme?: string;
  setId?: string;
  /** Quelle, z. B. "StoneWars", "Promobricks" */
  source?: string;
  /** Direkter Link zum Quell-Artikel (falls bekannt) */
  url?: string;
  /** Direkter Link zum Angebot (falls bekannt; sonst wird eine Shop-Suche verlinkt) */
  dealUrl?: string;
  /** ISO-Datetime */
  postedAt: string;
  dealPriceEUR?: number;
  dealRrpEUR?: number;
  dealShop?: string;
  confidence?: "rumor" | "confirmed";
}

export interface CityIdea {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  difficulty: "easy" | "medium" | "hard";
  emoji: string;
  tags: string[];
}
