import type { LocalizedString } from "./types";

/**
 * Aktuelle und angekuendigte LEGO-Gratis-Beigaben (GWP = Gift with Purchase).
 * Redaktionell gepflegt; der Telegram-Watcher meldet neue Aktionen automatisch,
 * die dann hier eingepflegt werden.
 */
export interface GwpPromo {
  id: string;
  /** Setnummer der Beigabe, z. B. "40894" (null wenn unbekannt) */
  setNumber: string | null;
  name: LocalizedString;
  /** Bedingung, z. B. "Ab 180 EUR Einkaufswert im LEGO Shop" */
  condition: LocalizedString;
  shop: string;
  /** ISO-Datum Aktionsstart */
  startDate: string;
  /** ISO-Datum Aktionsende (null = bis Vorrat reicht / unbekannt) */
  endDate: string | null;
  /** Ungefaehrer Warenwert in EUR */
  valueEUR: number | null;
  imageUrl?: string;
  source: string;
  status: "confirmed" | "rumor";
  note?: LocalizedString;
}

// Platzhalter - wird vom Recherche-Agenten mit allen aktuellen Aktionen ersetzt.
export const GWPS: GwpPromo[] = [
  {
    id: "40894-lenkrad",
    setNumber: "40894",
    name: { de: "Koenigsegg Lenkrad", en: "Koenigsegg Steering Wheel" },
    condition: {
      de: "Gratis beim Kauf des Technic Koenigsegg Sadair's Spear (42232)",
      en: "Free with purchase of the Technic Koenigsegg Sadair's Spear (42232)",
    },
    shop: "LEGO Shop",
    startDate: "2026-07-01",
    endDate: null,
    valueEUR: null,
    imageUrl: "https://images.brickset.com/sets/images/40894-1.jpg",
    source: "StoneWars",
    status: "confirmed",
  },
];
