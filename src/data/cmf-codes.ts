// Box-Codes der LEGO-Minifiguren-Sammelserien (Blind Boxes).
//
// Seit Serie 24 stecken die Sammelfiguren in Kartons statt Tueten. Auf der
// Unterseite jeder Box sitzt rechts neben dem Strichcode ein kleiner
// Data-Matrix-Code. Der decodierte Inhalt enthaelt eine 7-stellige
// LEGO-Element-Nummer, die eindeutig einer Figur zugeordnet ist (mehrere
// Varianten pro Figur, je nach Produktionsregion EU/US).
//
// Quellen (Stand 11.07.2026): minifigurescanner.com, Jay's Brick Blog,
// Brick Fanatics. Redaktionell gepflegt - neue Serien hier ergaenzen.

export interface CmfFigure {
  /** Nummer innerhalb der Serie (1-12) */
  no: number;
  name: { de: string; en: string };
  /** Bekannte Element-Codes aus dem Data-Matrix-Code (7-stellig) */
  codes: string[];
}

export interface CmfSeries {
  /** LEGO-Setnummer der Serie, z. B. "71052" */
  setNumber: string;
  name: { de: string; en: string };
  /** Verkaufsfenster, nur zur Anzeige */
  window: { de: string; en: string };
  figures: CmfFigure[];
}

export const CMF_SERIES: CmfSeries[] = [
  {
    setNumber: "71052",
    name: { de: "Minifiguren Serie 29", en: "Minifigures Series 29" },
    window: { de: "ab Mai 2026", en: "from May 2026" },
    figures: [
      { no: 1, name: { de: "Roboter-T.-Rex", en: "Robot T. rex" }, codes: ["6603331", "6605257"] },
      { no: 2, name: { de: "Meeresbiologin", en: "Marine Biologist" }, codes: ["6603321", "6605247"] },
      { no: 3, name: { de: "Bionicle-Cosplayer", en: "Bionicle Cosplayer" }, codes: ["6603325", "6605251"] },
      { no: 4, name: { de: "Monsterjaeger", en: "Monster Hunter" }, codes: ["6603328", "6605254"] },
      { no: 5, name: { de: "Bubble-Tea-Fan", en: "Boba Cup Fan" }, codes: ["6603324", "6605250"] },
      { no: 6, name: { de: "Muellmonster", en: "Trash Monster" }, codes: ["6603330", "6605256"] },
      { no: 7, name: { de: "Chocolatier", en: "Chocolatier" }, codes: ["6603323", "6605249"] },
      { no: 8, name: { de: "Tuba-Spieler", en: "Tuba Player" }, codes: ["6603322", "6605248"] },
      { no: 9, name: { de: "Fussball-Torhueterin", en: "Soccer Goalkeeper" }, codes: ["6603320", "6605246"] },
      { no: 10, name: { de: "Suesse Hexe", en: "Cute Witch" }, codes: ["6603329", "6605255"] },
      { no: 11, name: { de: "Mysterioeser Ronin", en: "Mysterious Ronin" }, codes: ["6603327", "6605253"] },
      { no: 12, name: { de: "Einhorn-Elfe", en: "Unicorn Elf" }, codes: ["6603326", "6605252"] },
    ],
  },
  {
    setNumber: "71051",
    name: { de: "Minifiguren Serie 28 - Tiere", en: "Minifigures Series 28 - Animals" },
    window: { de: "Januar bis April 2026", en: "January to April 2026" },
    figures: [
      { no: 1, name: { de: "Pfau", en: "Peacock" }, codes: ["6584394", "6584381"] },
      { no: 2, name: { de: "Flauschige Katze", en: "Fluffy Cat" }, codes: ["6584395", "6584382"] },
      { no: 3, name: { de: "Goldfisch", en: "Goldfish" }, codes: ["6584392", "6584379"] },
      { no: 4, name: { de: "Affe", en: "Monkey" }, codes: ["6584398", "6584385"] },
      { no: 5, name: { de: "Frosch", en: "Frog" }, codes: ["6584390", "6584377"] },
      { no: 6, name: { de: "Koala", en: "Koala" }, codes: ["6584396", "6584383"] },
      { no: 7, name: { de: "Dalmatiner", en: "Dalmatian" }, codes: ["6584391", "6584378"] },
      { no: 8, name: { de: "Krokodil", en: "Crocodile" }, codes: ["6584389", "6584376"] },
      { no: 9, name: { de: "Delfin", en: "Dolphin" }, codes: ["6584397", "6584384"] },
      { no: 10, name: { de: "Suesser Hase", en: "Cute Bunny" }, codes: ["6584393", "6584380"] },
      { no: 11, name: { de: "Loewe", en: "Lion" }, codes: ["6584388", "6584375"] },
      { no: 12, name: { de: "Papagei", en: "Parrot" }, codes: ["6584387", "6584374"] },
    ],
  },
];

export interface CmfMatch {
  series: CmfSeries;
  figure: CmfFigure;
  /** Der Code, ueber den der Treffer zustande kam */
  code: string;
}

/**
 * Sucht einen decodierten Data-Matrix-Inhalt (oder manuell eingetippten
 * Code) gegen alle bekannten Serien-Codes. Es reicht, wenn einer der
 * bekannten 7-stelligen Codes im Zifferninhalt vorkommt.
 */
export function matchCmfCode(raw: string): CmfMatch | null {
  const digits = raw.replace(/\D+/g, "");
  if (digits.length < 7) return null;
  for (const series of CMF_SERIES) {
    for (const figure of series.figures) {
      for (const code of figure.codes) {
        if (digits.includes(code)) return { series, figure, code };
      }
    }
  }
  return null;
}
