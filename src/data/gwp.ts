import type { LocalizedString } from "./types";

/**
 * Aktuelle und angekündigte LEGO-Gratis-Beigaben (GWP = Gift with Purchase).
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
  /** Ungefährer Warenwert in EUR */
  valueEUR: number | null;
  imageUrl?: string;
  source: string;
  status: "confirmed" | "rumor";
  note?: LocalizedString;
}

// Stand: 11.07.2026. Recherchiert via StoneWars, Promobricks, zusammengebaut,
// Brick Fanatics, Jay's Brick Blog, Bricks Up, Toys N Bricks und Steine-Kanal.
// Hinweis: Das Koenigsegg-Lenkrad 40894 (beim Kauf von 42232) lief nur vom
// 01.-06.07.2026 und ist daher hier nicht mehr gelistet.
export const GWPS: GwpPromo[] = [
  {
    id: "40912-sea-serpent",
    setNumber: "40912",
    name: {
      de: "LEGO Ideas Seeschlange (Retro-GWP)",
      en: "LEGO Ideas Sea Serpent (retro GWP)",
    },
    condition: {
      de: "Ab 180 EUR Einkaufswert im LEGO Shop während der Insiders Days (LEGO Insiders Konto erforderlich)",
      en: "From 180 EUR spend at the LEGO Shop during Insiders Days (LEGO Insiders account required)",
    },
    shop: "LEGO Shop",
    startDate: "2026-07-07",
    endDate: "2026-07-12",
    valueEUR: 24.99,
    imageUrl: "https://images.brickset.com/sets/images/40912-1.jpg",
    source: "StoneWars / Promobricks / Jay's Brick Blog",
    status: "confirmed",
    note: {
      de: "241 Teile, 2 Retro-Ritterfiguren im Stil der Black Knights von 1992, bedrucktes Stoffsegel. Solange Vorrat reicht; in Australien und Neuseeland bereits vergriffen.",
      en: "241 pieces, 2 retro knight minifigures in the style of the 1992 Black Knights, printed fabric sail. While stocks last; already sold out in Australia and New Zealand.",
    },
  },
  {
    id: "5010053-airplane",
    setNumber: "5010053",
    name: {
      de: "Flugzeug (Special Edition)",
      en: "Airplane (Special Edition)",
    },
    condition: {
      de: "Ab 100 EUR Einkaufswert auf LEGO City, Creator 3-in-1 oder Friends im LEGO Shop während der Insiders Days",
      en: "From 100 EUR spend on LEGO City, Creator 3-in-1 or Friends at the LEGO Shop during Insiders Days",
    },
    shop: "LEGO Shop",
    startDate: "2026-07-07",
    endDate: "2026-07-12",
    valueEUR: 19.99,
    imageUrl: "https://images.brickset.com/sets/images/5010053-1.jpg",
    source: "Promobricks / zusammengebaut",
    status: "confirmed",
    note: {
      de: "149 Teile, 2 Minifiguren; Retro-Flugzeug im Stil der 80er/90er, vorher exklusiv in Flughafen-LEGO-Stores. Solange Vorrat reicht.",
      en: "149 pieces, 2 minifigures; retro airplane in 80s/90s style, previously exclusive to airport LEGO Stores. While stocks last.",
    },
  },
  {
    id: "40768-shuttlepod",
    setNumber: "40768",
    name: {
      de: "Star Trek: Type-15 Shuttlepod",
      en: "Star Trek: Type-15 Shuttlepod",
    },
    condition: {
      de: "Gratis beim Kauf der LEGO Icons Star Trek U.S.S. Enterprise NCC-1701-D (10356)",
      en: "Free with purchase of the LEGO Icons Star Trek U.S.S. Enterprise NCC-1701-D (10356)",
    },
    shop: "LEGO Shop",
    startDate: "2025-11-28",
    endDate: "2026-08-31",
    valueEUR: null,
    imageUrl: "https://images.brickset.com/sets/images/40768-1.jpg",
    source: "Brick Fanatics / Jay's Brick Blog",
    status: "confirmed",
    note: {
      de: "261 Teile, exklusive Ro-Laren-Minifigur. Aktuell nur noch in Australien verfügbar (mehrfach verlängert, zuletzt bis 31.08.2026); in Europa und den USA seit dem Start vergriffen.",
      en: "261 pieces, exclusive Ro Laren minifigure. Currently only available in Australia (extended several times, most recently until 31 Aug 2026); sold out in Europe and the US since launch.",
    },
  },
  {
    id: "40887-ditto-gwp",
    setNumber: "40887",
    name: {
      de: "Pokemon SMART Play: Ditto als Schiggy - Filmabend",
      en: "Pokemon SMART Play: Ditto as Squirtle - Movie Night",
    },
    condition: {
      de: "Ab 130 EUR Einkaufswert auf LEGO Pokemon Sets (inkl. Vorbestellungen)",
      en: "From 130 EUR spend on LEGO Pokemon sets (incl. pre-orders)",
    },
    shop: "LEGO Shop",
    startDate: "2026-08-01",
    endDate: "2026-12-31",
    valueEUR: null,
    imageUrl: "https://images.brickset.com/sets/images/40887-1.jpg",
    source: "StoneWars / Bricks Up / Brick Fanatics",
    status: "confirmed",
    note: {
      de: "Offiziell enthüllt: 185 Teile, erstes SMART-Play-GWP (Retro-Fernseher mit wechselbaren Kanälen). Aktuell nur über Pokemon-Center-Vorbestellungen (USA) erhältlich, im LEGO Shop zum Theme-Start am 01.08.2026 erwartet; die 130-EUR-Schwelle ist von USD/GBP abgeleitet und noch nicht final bestätigt.",
      en: "Officially revealed: 185 pieces, first SMART Play GWP (retro TV with changeable channels). Currently only via Pokemon Center pre-orders (USA), expected at the LEGO Shop for the theme launch on 1 Aug 2026; the 130 EUR threshold is derived from USD/GBP and not yet finally confirmed.",
    },
  },
  {
    id: "40896-x-files-gwp",
    setNumber: "40896",
    name: {
      de: "Akte X GWP (Name unbekannt)",
      en: "X-Files GWP (name unknown)",
    },
    condition: {
      de: "Voraussichtlich beim Kauf des LEGO Ideas Sets Akte X (21369)",
      en: "Expected with purchase of the LEGO Ideas X-Files set (21369)",
    },
    shop: "LEGO Shop",
    startDate: "2026-08-01",
    endDate: null,
    valueEUR: null,
    source: "Steine-Kanal (Leak via _itavix_bricks_)",
    status: "rumor",
    note: {
      de: "Unbestätigtes Gerücht: Das Ideas-Set 21369 (1.478 Teile, ca. 199,99 USD) soll am 01.08.2026 mit passendem GWP 40896 erscheinen; Inhalt unbekannt, spekuliert werden die Lone Gunmen.",
      en: "Unconfirmed rumor: the Ideas set 21369 (1,478 pieces, approx. 199.99 USD) is said to launch on 1 Aug 2026 with matching GWP 40896; contents unknown, the Lone Gunmen are speculated.",
    },
  },
];
