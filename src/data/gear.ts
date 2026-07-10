import type { LocalizedString } from "./types";

/** Kategorie eines Gear-Eintrags: Buch, Spiel, Aufbewahrung oder Merch. */
export type GearKind = "buch" | "spiel" | "aufbewahrung" | "merch";

/** Kuratierter Eintrag für die Rubrik "Bücher & Merch" - alles rund um LEGO abseits der Sets. */
export interface GearItem {
  /** Slug, z. B. "das-neue-lego-ideen-buch" */
  id: string;
  name: LocalizedString;
  kind: GearKind;
  /** Erscheinungs-/Release-Jahr, null wenn unbekannt oder laufend */
  year: number | null;
  /** Grober Richtpreis in EUR (Neuware bzw. üblicher Marktpreis), null wenn kostenlos/stark schwankend */
  priceEUR: number | null;
  /** Nur bei Büchern, falls auffindbar */
  isbn?: string;
  /** 2-3 Sätze, sammler-relevant */
  description: LocalizedString;
  emoji: string;
}

// Kuratierte Auswahl, Stand Juli 2026. Preise sind grobe Richtwerte (Neuware
// bzw. bei EOL-Artikeln der übliche Zweitmarktpreis), keine Live-Daten.
export const GEAR: GearItem[] = [
  /* ---------- Bücher ---------- */
  {
    id: "das-neue-lego-ideen-buch",
    name: { de: "Das neue LEGO Ideen Buch (DK)", en: "The New LEGO Ideas Book (DK)" },
    kind: "buch",
    year: 2023,
    priceEUR: 20,
    isbn: "978-3-8310-4572-3",
    description: {
      de: "Der DK-Klassiker in komplett neuer Auflage: über 500 Bauideen vom Traumhaus bis zur Zeitmaschine, dazu Interviews mit echten LEGO-Designern. Das Standardwerk, um aus der eigenen Steinekiste mehr herauszuholen. Gehört in jedes AFOL-Bücherregal.",
      en: "The DK classic in a fully new edition: over 500 building ideas from dream house to time machine, plus interviews with real LEGO designers. The standard work for getting more out of your own brick bin. Belongs on every AFOL bookshelf.",
    },
    emoji: "💡",
  },
  {
    id: "das-lego-buch-jubilaeumsausgabe",
    name: { de: "Das LEGO Buch - Jubiläumsausgabe (DK)", en: "The LEGO Book - Anniversary Edition (DK)" },
    kind: "buch",
    year: 2018,
    priceEUR: 60,
    isbn: "978-3-8310-3597-7",
    description: {
      de: "Die große LEGO-Chronik zum 60. Jubiläum des Steins, mit exklusivem 2x4-Jubiläumsstein im Cover. War schnell ausverkauft und wurde zeitweise für deutlich über 100 EUR gehandelt. Ein Buch, das selbst zum Sammlerstück geworden ist.",
      en: "The big LEGO chronicle for the brick's 60th anniversary, with an exclusive 2x4 anniversary brick embedded in the cover. Sold out quickly and traded well above 100 EUR for a while. A book that became a collectible itself.",
    },
    emoji: "📕",
  },
  {
    id: "lego-star-wars-lexikon-der-minifiguren",
    name: {
      de: "LEGO Star Wars: Lexikon der Minifiguren - Neuausgabe (DK)",
      en: "LEGO Star Wars Character Encyclopedia - Updated Edition (DK)",
    },
    kind: "buch",
    year: 2025,
    priceEUR: 30,
    isbn: "978-3-8310-5118-2",
    description: {
      de: "Über 200 LEGO Star Wars Minifiguren im Porträt, von Luke Skywalker bis zu den Stars aus The Mandalorian. Die Neuausgabe 2025 enthält eine exklusive Imperator-Palpatine-Minifigur, die es nur in diesem Buch gibt. Genau diese Beilage-Figuren treiben den Wert älterer Ausgaben regelmäßig nach oben.",
      en: "Over 200 LEGO Star Wars minifigures in portrait, from Luke Skywalker to the stars of The Mandalorian. The 2025 edition includes an exclusive Emperor Palpatine minifigure available only in this book. It is exactly these bundled figures that regularly push the value of older editions up.",
    },
    emoji: "🌌",
  },
  {
    id: "lego-harry-potter-magical-guide",
    name: {
      de: "LEGO Harry Potter: The Magical Guide to the Wizarding World (DK)",
      en: "LEGO Harry Potter: The Magical Guide to the Wizarding World (DK)",
    },
    kind: "buch",
    year: 2019,
    priceEUR: 25,
    isbn: "978-1-4654-8766-7",
    description: {
      de: "DK-Führer durch die LEGO-Zauberwelt: Sets, Minifiguren und Schauplätze von Hogwarts bis in die Winkelgasse. Kam mit exklusiver goldener Harry-Potter-Minifigur zum 20. Jubiläum der Reihe. Englischsprachig, aber vor allem wegen der Figur bei Sammlern gefragt.",
      en: "DK guide through the LEGO wizarding world: sets, minifigures and locations from Hogwarts to Diagon Alley. Shipped with an exclusive golden Harry Potter minifigure for the line's 20th anniversary. Sought after by collectors mainly for that figure.",
    },
    emoji: "🪄",
  },
  {
    id: "lego-minifigure-a-visual-history",
    name: {
      de: "LEGO Minifigure: A Visual History - Updated Edition (DK)",
      en: "LEGO Minifigure: A Visual History - Updated Edition (DK)",
    },
    kind: "buch",
    year: 2025,
    priceEUR: 40,
    isbn: "978-0-241-71641-0",
    description: {
      de: "Die große Minifiguren-Enzyklopädie mit über 2.500 Figuren aus fast fünf Jahrzehnten, inklusive neuer Themen wie Minecraft und Animal Crossing. Der Neuausgabe liegt eine exklusive Astronauten-Minifigur bei. Für Minifiguren-Sammler das Referenzwerk schlechthin.",
      en: "The big minifigure encyclopedia with over 2,500 figures from almost five decades, including newer themes like Minecraft and Animal Crossing. The updated edition comes with an exclusive astronaut minifigure. The reference work for minifigure collectors, plain and simple.",
    },
    emoji: "🧑‍🚀",
  },
  {
    id: "the-lego-ideas-book-new-edition",
    name: { de: "The LEGO Ideas Book - New Edition (DK)", en: "The LEGO Ideas Book - New Edition (DK)" },
    kind: "buch",
    year: 2022,
    priceEUR: 30,
    isbn: "978-0-7440-6093-5",
    description: {
      de: "Die englische Neuauflage des meistverkauften LEGO-Ideenbuchs, diesmal mit über 200 Modellen von Fan-Baumeistern aus aller Welt. Viele Techniken lassen sich direkt für eigene MOCs übernehmen. Die Erstausgabe von 2011 war eines der erfolgreichsten LEGO-Bücher überhaupt.",
      en: "The English new edition of the best-selling LEGO ideas book, this time with over 200 models by fan builders from around the world. Many techniques transfer directly to your own MOCs. The 2011 first edition was one of the most successful LEGO books ever.",
    },
    emoji: "🛠️",
  },
  {
    id: "brick-by-brick",
    name: {
      de: "Brick by Brick (David Robertson & Bill Breen)",
      en: "Brick by Brick (David Robertson & Bill Breen)",
    },
    kind: "buch",
    year: 2013,
    priceEUR: 18,
    isbn: "978-0-307-95161-8",
    description: {
      de: "Die Wirtschaftsgeschichte hinter dem Klemmbaustein: Wie LEGO Anfang der 2000er fast pleiteging und sich mit radikalem Fokus neu erfand. Pflichtlektüre für alle, die verstehen wollen, warum Sets heute so designt und vermarktet werden. Englischsprachig.",
      en: "The business story behind the brick: how LEGO nearly went bankrupt in the early 2000s and reinvented itself with radical focus. Required reading for anyone who wants to understand why sets are designed and marketed the way they are today.",
    },
    emoji: "📈",
  },
  {
    id: "unofficial-lego-builders-guide",
    name: {
      de: "The Unofficial LEGO Builder's Guide (Allan Bedford)",
      en: "The Unofficial LEGO Builder's Guide (Allan Bedford)",
    },
    kind: "buch",
    year: 2012,
    priceEUR: 25,
    isbn: "978-1-59327-441-2",
    description: {
      de: "Der Klassiker unter den Bautechnik-Büchern (No Starch Press): Maßstäbe, Verstrebungen, SNOT-Techniken und stabile Konstruktionen, systematisch erklärt. Kein Set-Katalog, sondern ein echtes Handwerksbuch für MOC-Bauer. Englischsprachig, 2. Auflage.",
      en: "The classic among building-technique books (No Starch Press): scale, bracing, SNOT techniques and stable construction, explained systematically. Not a set catalog but a real craft manual for MOC builders. Second edition.",
    },
    emoji: "📐",
  },
  {
    id: "lego-eisenbahn-matthes",
    name: {
      de: "LEGO-Eisenbahn: Konzepte und Techniken (Holger Matthes)",
      en: "LEGO Trains: Concepts and Techniques (Holger Matthes)",
    },
    kind: "buch",
    year: 2019,
    priceEUR: 33,
    isbn: "978-3-86490-641-1",
    description: {
      de: "Das deutsche Standardwerk für LEGO-Eisenbahner vom bekannten AFOL Holger Matthes (dpunkt.verlag). Von Fahrwerken über maßstäbliche Loks bis zu allgemeinen Bautechniken, die weit über das Zug-Thema hinaus nützlich sind. Ideal als Begleitbuch zu jeder City-Anlage.",
      en: "The German standard work for LEGO train builders by well-known AFOL Holger Matthes (dpunkt publishing). From bogies to scale locomotives to general building techniques useful far beyond trains. An ideal companion for any city layout.",
    },
    emoji: "🚂",
  },
  {
    id: "lego-collector-sammlerkatalog",
    name: {
      de: "LEGO Collector - Sammlerkatalog (Fantasia Verlag)",
      en: "LEGO Collector - Collector's Guide (Fantasia Verlag)",
    },
    kind: "buch",
    year: 2011,
    priceEUR: 80,
    isbn: "978-3-935976-64-0",
    description: {
      de: "Über 7.000 Sets auf 928 Seiten, zweisprachig, mit Seltenheits-Bewertung von 1 bis 6 Steinen und beiliegendem LEGO-Schlüsselanhänger. Lange vergriffen und selbst ein gesuchtes Sammlerstück. Wer einen gut erhaltenen Katalog findet, sollte zugreifen.",
      en: "Over 7,000 sets on 928 pages, bilingual, with a rarity rating from 1 to 6 bricks and a bundled LEGO key chain. Long out of print and a sought-after collectible in its own right. If you find a well-kept copy, grab it.",
    },
    emoji: "📖",
  },
  {
    id: "365-ideen-fuer-deine-lego-steine",
    name: { de: "365 Ideen für deine LEGO Steine (DK)", en: "365 Things to Do with LEGO Bricks (DK)" },
    kind: "buch",
    year: 2017,
    priceEUR: 20,
    isbn: "978-3-8310-3249-5",
    description: {
      de: "Für jeden Tag des Jahres eine Bau- oder Spielidee, von Simon Hugo mit Tricks der offiziellen LEGO-Baumeister. Perfektes Einsteiger- und Geschenkbuch für Kinder ab 6 Jahren. Der ideale Weg, um die Reste-Kiste wieder auf den Tisch zu holen.",
      en: "A building or play idea for every day of the year, by Simon Hugo with tricks from official LEGO builders. A perfect starter and gift book for kids from age 6. The ideal way to get the spare-parts bin back on the table.",
    },
    emoji: "🗓️",
  },
  {
    id: "ninjago-sieg-des-gruenen-ninja",
    name: {
      de: "LEGO Ninjago: Der Sieg des grünen Ninja (Ameet, mit Minifigur Lloyd)",
      en: "LEGO Ninjago: Victory of the Green Ninja (Ameet, with Lloyd minifigure)",
    },
    kind: "buch",
    year: 2020,
    priceEUR: 8,
    isbn: "978-3-96080-457-1",
    description: {
      de: "Typisches Ameet-Kinderbuch mit echter LEGO-Minifigur als Beigabe, hier der grüne Ninja Lloyd. Die Buch-Minifiguren tauchen teils in leicht anderen Varianten als in Sets auf und sind darum bei Minifiguren-Sammlern beliebt. Günstiger Einstieg für junge Leser ab etwa 6 Jahren.",
      en: "A typical Ameet children's book with a real LEGO minifigure included, here the green ninja Lloyd. Book minifigures sometimes appear in slightly different variants than in sets, which makes them popular with minifigure collectors. A cheap entry point for young readers from about age 6.",
    },
    emoji: "🥷",
  },

  /* ---------- Spiele ---------- */
  {
    id: "lego-star-wars-skywalker-saga",
    name: {
      de: "LEGO Star Wars: Die Skywalker Saga (Videospiel)",
      en: "LEGO Star Wars: The Skywalker Saga (video game)",
    },
    kind: "spiel",
    year: 2022,
    priceEUR: 25,
    description: {
      de: "Alle neun Skywalker-Filme in einem Spiel, mit hunderten freischaltbaren Charakteren, für PC und alle Konsolen. Das erfolgreichste LEGO-Videospiel aller Zeiten mit Millionen verkauften Exemplaren. Regelmäßig stark reduziert im Sale zu finden.",
      en: "All nine Skywalker films in one game, with hundreds of unlockable characters, on PC and all consoles. The most successful LEGO video game of all time with millions of copies sold. Regularly found heavily discounted in sales.",
    },
    emoji: "⚔️",
  },
  {
    id: "lego-fortnite",
    name: { de: "LEGO Fortnite (Videospiel)", en: "LEGO Fortnite (video game)" },
    kind: "spiel",
    year: 2023,
    priceEUR: null,
    description: {
      de: "Das kostenlose Survival-Crafting-Universum in Fortnite, entstanden aus der großen Partnerschaft zwischen LEGO und Epic Games. Minifiguren-Skins, baubare Dörfer und ständig neue Welten. Kostenlos spielbar, Skins und Pässe kosten extra.",
      en: "The free survival crafting universe inside Fortnite, born from the big LEGO and Epic Games partnership. Minifigure skins, buildable villages and constantly new worlds. Free to play, with skins and passes costing extra.",
    },
    emoji: "🌋",
  },
  {
    id: "lego-horizon-adventures",
    name: { de: "LEGO Horizon Adventures (Videospiel)", en: "LEGO Horizon Adventures (video game)" },
    kind: "spiel",
    year: 2024,
    priceEUR: 40,
    description: {
      de: "Aloys Abenteuer als charmante LEGO-Neuerzählung, entwickelt mit Guerrilla Games für PS5, PC und Switch. Bemerkenswert: eines der ersten LEGO-Spiele, in denen wirklich die komplette Welt aus digitalen Steinen gebaut ist. Auch als Duo im Koop spielbar.",
      en: "Aloy's adventure retold in charming LEGO form, developed with Guerrilla Games for PS5, PC and Switch. Notable as one of the first LEGO games where the entire world is genuinely built from digital bricks. Playable in co-op too.",
    },
    emoji: "🏹",
  },
  {
    id: "lego-2k-drive",
    name: { de: "LEGO 2K Drive (Videospiel)", en: "LEGO 2K Drive (video game)" },
    kind: "spiel",
    year: 2023,
    priceEUR: 20,
    description: {
      de: "Open-World-Rennspiel, in dem sich Fahrzeuge Stein für Stein selbst bauen und umbauen lassen. Der Fahrzeug-Editor ist praktisch ein digitaler MOC-Baukasten auf Rädern. Für alle Plattformen erschienen und oft günstig im Angebot.",
      en: "An open-world racing game where vehicles can be built and rebuilt brick by brick. The garage editor is basically a digital MOC workshop on wheels. Released for all platforms and often cheap on sale.",
    },
    emoji: "🏎️",
  },
  {
    id: "lego-schach-40174",
    name: { de: "LEGO Schach-Set 40174", en: "LEGO Iconic Chess Set 40174" },
    kind: "spiel",
    year: 2017,
    priceEUR: 100,
    description: {
      de: "Komplettes Schach- und Damespiel aus über 1.400 Teilen, mit Minifiguren als Figuren und Schubladen für die Aufbewahrung. UVP war 64,99 EUR, seit dem EOL zieht der Preis kontinuierlich an. Der Nachfolger im Museums-Stil hat das Original nur noch begehrter gemacht.",
      en: "A complete chess and checkers game of over 1,400 pieces, with minifigures as chessmen and drawers for storage. RRP was 64.99 EUR and the price has climbed steadily since retirement. Its museum-style successor only made the original more desirable.",
    },
    emoji: "♟️",
  },
  {
    id: "lego-ramses-pyramid-3843",
    name: { de: "LEGO Games: Ramses Pyramid 3843", en: "LEGO Games: Ramses Pyramid 3843" },
    kind: "spiel",
    year: 2009,
    priceEUR: 45,
    description: {
      de: "Das Aushängeschild der LEGO-Games-Brettspielreihe, entworfen vom Spieleautor Reiner Knizia und 2009 als Spiel-Innovation ausgezeichnet. Hält bis heute den Rekord für die meisten Mikrofiguren in einem Set (13). Komplette Exemplare mit Anleitung werden auf dem Zweitmarkt zunehmend gesucht.",
      en: "The flagship of the LEGO Games board game line, designed by game author Reiner Knizia and awarded for toy innovation in 2009. Still holds the record for most microfigures in one set (13). Complete copies with instructions are increasingly sought after on the secondary market.",
    },
    emoji: "🔺",
  },
  {
    id: "lego-creationary-3844",
    name: { de: "LEGO Games: Creationary 3844", en: "LEGO Games: Creationary 3844" },
    kind: "spiel",
    year: 2009,
    priceEUR: 35,
    description: {
      de: "Das LEGO-Pendant zu Montagsmaler: bauen statt zeichnen, die anderen raten. Eines der beliebtesten Spiele der eingestellten LEGO-Games-Reihe mit dem baubaren Würfel. Als Partyspiel zeitlos, als Sammlerstück ein schöner Vertreter dieser kurzen Ära.",
      en: "The LEGO take on Pictionary: build instead of draw while the others guess. One of the most popular games of the discontinued LEGO Games line with its buildable die. Timeless as a party game and a nice collectible from that short era.",
    },
    emoji: "🎲",
  },
  {
    id: "lego-heroica",
    name: { de: "LEGO Heroica-Reihe (2011-2012)", en: "LEGO Heroica series (2011-2012)" },
    kind: "spiel",
    year: 2011,
    priceEUR: 40,
    description: {
      de: "Modulare Fantasy-Dungeon-Crawler wie Draida, Fortaan und Nathuz, die sich zu einer großen Spielwelt kombinieren lassen. Die Reihe wurde nach kurzer Zeit eingestellt und hat eine treue Fangemeinde. Vollständige Sets mit allen Mikrofiguren erzielen ordentliche Sammlerpreise.",
      en: "Modular fantasy dungeon crawlers like Draida, Fortaan and Nathuz that combine into one big game world. The line was discontinued after a short run and has a loyal fan base. Complete sets with all microfigures fetch solid collector prices.",
    },
    emoji: "🐉",
  },
  {
    id: "lego-minifigure-faces-puzzle",
    name: {
      de: "LEGO Minifigure Faces Puzzle, 1.000 Teile (Chronicle Books)",
      en: "LEGO Minifigure Faces Puzzle, 1,000 pieces (Chronicle Books)",
    },
    kind: "spiel",
    year: 2020,
    priceEUR: 17,
    description: {
      de: "Offiziell lizenziertes 1.000-Teile-Puzzle voller Minifiguren-Gesichter aus mehreren Jahrzehnten. Ganz nebenbei ein kleiner Crashkurs in Minifiguren-Geschichte, vom klassischen Smiley bis zur Doppelgesicht-Ära. Chronicle Books hat inzwischen eine ganze LEGO-Puzzle-Reihe im Programm.",
      en: "An officially licensed 1,000-piece puzzle full of minifigure faces from several decades. Incidentally a small crash course in minifigure history, from the classic smiley to the dual-face era. Chronicle Books now runs a whole LEGO puzzle line.",
    },
    emoji: "🧩",
  },

  /* ---------- Aufbewahrung & Zubehör ---------- */
  {
    id: "lego-steinetrenner",
    name: { de: "LEGO Steinetrenner (Brick Separator)", en: "LEGO Brick Separator" },
    kind: "aufbewahrung",
    year: null,
    priceEUR: 3,
    description: {
      de: "Das mit Abstand wichtigste Zubehörteil überhaupt: löst festgeklemmte Platten und Fliesen, ohne Fingernägel oder Steine zu ruinieren. Das orange Standardmodell liegt vielen großen Sets bei und kostet einzeln nur wenige Euro. Profis haben immer mindestens zwei davon griffbereit.",
      en: "By far the most important accessory there is: it frees stuck plates and tiles without ruining fingernails or bricks. The orange standard model comes with many larger sets and costs only a few euros on its own. Pros always keep at least two within reach.",
    },
    emoji: "🟧",
  },
  {
    id: "room-copenhagen-storage-brick-8",
    name: { de: "Room Copenhagen LEGO Storage Brick 8", en: "Room Copenhagen LEGO Storage Brick 8" },
    kind: "aufbewahrung",
    year: null,
    priceEUR: 40,
    description: {
      de: "Der ikonische XXL-Aufbewahrungsstein in 2x4-Optik, offiziell lizenziert und wie echte Steine stapelbar. In dutzenden Farben erhältlich und längst selbst ein Deko-Sammelobjekt fürs LEGO-Zimmer. Kleinere Varianten mit 1, 2 und 4 Noppen ergänzen das System.",
      en: "The iconic XXL storage brick in 2x4 look, officially licensed and stackable like real bricks. Available in dozens of colors and long since a display collectible for the LEGO room in its own right. Smaller 1, 2 and 4 stud variants complete the system.",
    },
    emoji: "🧱",
  },
  {
    id: "room-copenhagen-sorting-box-to-go",
    name: { de: "Room Copenhagen LEGO Sorting Box To Go", en: "Room Copenhagen LEGO Sorting Box To Go" },
    kind: "aufbewahrung",
    year: null,
    priceEUR: 17,
    description: {
      de: "Transportabler Sortierkasten mit Trennwänden, um Teile nach Farbe oder Größe getrennt mitzunehmen. Ideal für Bauprojekte, die zwischen Wohnzimmer, Urlaub und Stammtisch pendeln. Für die Grundsortierung großer Sammlungen kombiniert man ihn am besten mit klassischen Schraubenkästen.",
      en: "A portable sorting case with dividers for carrying parts separated by color or size. Ideal for build projects that commute between living room, vacation and fan meetups. For base-sorting large collections, combine it with classic hardware organizers.",
    },
    emoji: "🧳",
  },
  {
    id: "lego-storage-head",
    name: { de: "LEGO Storage Head (Minifiguren-Kopf-Box)", en: "LEGO Storage Head (minifigure head box)" },
    kind: "aufbewahrung",
    year: null,
    priceEUR: 25,
    description: {
      de: "Aufbewahrungsbox in Form eines überdimensionalen Minifiguren-Kopfs, vom klassischen Smiley bis zu Sondergesichtern wie Kürbis oder Weihnachtsmann. Die Saison-Varianten verschwinden schnell wieder und sind bei Sammlern beliebt. Praktisch für Kleinteile, dekorativ im Regal.",
      en: "A storage box shaped like an oversized minifigure head, from the classic smiley to special faces like pumpkin or Santa. The seasonal variants vanish quickly and are popular with collectors. Practical for small parts, decorative on the shelf.",
    },
    emoji: "🙂",
  },
  {
    id: "ikea-bygglek",
    name: { de: "IKEA BYGGLEK Boxen (mit LEGO Noppen)", en: "IKEA BYGGLEK boxes (with LEGO studs)" },
    kind: "aufbewahrung",
    year: 2020,
    priceEUR: 15,
    description: {
      de: "Die offizielle IKEA-LEGO-Kollaboration: weiße Boxen mit Noppen auf Deckel und Gehäuse, auf denen direkt gebaut werden kann. Aufbewahrung und Spielfläche in einem, dazu ein eigenes Steine-Set (40357). Die Reihe wurde eingestellt und wird seitdem gern gehortet.",
      en: "The official IKEA and LEGO collaboration: white boxes with studs on lid and body that you can build on directly. Storage and play surface in one, plus its own brick set (40357). The line was discontinued and has been hoarded ever since.",
    },
    emoji: "📦",
  },
  {
    id: "ikea-detolf-vitrine",
    name: { de: "IKEA DETOLF Vitrine", en: "IKEA DETOLF display cabinet" },
    kind: "aufbewahrung",
    year: null,
    priceEUR: 80,
    description: {
      de: "Der inoffizielle Standard der AFOL-Szene: kaum eine Sammlungs-Vorstellung ohne die schmale Glasvitrine aus dem Möbelhaus. Vier Ebenen, staubdicht genug für Sets und Minifiguren-Armeen, unschlagbares Preis-Leistungs-Verhältnis. Mit LED-Streifen nachgerüstet wird sie zur Galerie.",
      en: "The unofficial standard of the AFOL scene: hardly any collection showcase exists without this slim glass cabinet from the furniture store. Four levels, dust-tight enough for sets and minifigure armies, unbeatable value. Retrofit LED strips and it becomes a gallery.",
    },
    emoji: "🗄️",
  },
  {
    id: "room-copenhagen-display-case-16",
    name: {
      de: "LEGO Minifiguren Display Case (16 Figuren)",
      en: "LEGO minifigure display case (16 figures)",
    },
    kind: "aufbewahrung",
    year: null,
    priceEUR: 30,
    description: {
      de: "Offizielle Vitrine von Room Copenhagen für 16 Minifiguren, mit Noppen-Podesten und stapelbarem Gehäuse in Steinform. Hält Staub fern und lässt sich hängen oder stellen. Für wertvolle Figuren wie CMF-Serien die deutlich bessere Wahl als die lose Schublade.",
      en: "The official Room Copenhagen case for 16 minifigures, with studded pedestals and a stackable brick-shaped housing. Keeps dust away and can be hung or placed. For valuable figures like CMF series, a far better choice than the loose drawer.",
    },
    emoji: "🖼️",
  },
  {
    id: "wicked-brick-displays",
    name: { de: "Wicked Brick Acryl-Vitrinen & Ständer", en: "Wicked Brick acrylic display cases & stands" },
    kind: "aufbewahrung",
    year: null,
    priceEUR: 100,
    description: {
      de: "Der bekannteste Anbieter für passgenaue Acryl-Vitrinen und Wandhalterungen zu großen Sets, vom UCS Millennium Falcon bis zum Titanic-Modell. Schützt Investment-Sets vor Staub und UV-Licht, was beim Wiederverkauf bares Geld wert ist. Preise je nach Setgröße von etwa 20 bis weit über 150 EUR.",
      en: "The best-known maker of made-to-measure acrylic cases and wall mounts for large sets, from the UCS Millennium Falcon to the Titanic. Protects investment sets from dust and UV light, which is worth real money at resale. Prices range from about 20 to well over 150 EUR depending on set size.",
    },
    emoji: "🛡️",
  },

  /* ---------- Merch ---------- */
  {
    id: "lego-adidas-zx-8000",
    name: { de: "LEGO x adidas ZX 8000 Sneaker", en: "LEGO x adidas ZX 8000 sneaker" },
    kind: "merch",
    year: 2021,
    priceEUR: 130,
    description: {
      de: "Die Sneaker-Kollaboration in den klassischen LEGO-Primärfarben, inklusive Fersenkappe in Steine-Optik. Die Bricks-Kollektion von 2021 war schnell vergriffen, einzelne Colorways werden auf Sneaker-Plattformen deutlich über UVP gehandelt. Der Schnittpunkt von Sneaker- und LEGO-Sammlern.",
      en: "The sneaker collaboration in classic LEGO primary colors, complete with a brick-textured heel counter. The 2021 Bricks collection sold out fast and some colorways trade well above RRP on sneaker platforms. The intersection of sneaker and LEGO collecting.",
    },
    emoji: "👟",
  },
  {
    id: "lego-levis-kollektion",
    name: { de: "LEGO x Levi's Kollektion", en: "LEGO x Levi's collection" },
    kind: "merch",
    year: 2020,
    priceEUR: 40,
    description: {
      de: "Jacken, Hoodies und Jeans mit aufgenähten Noppen-Flächen, die sich mit echten LEGO-Elementen individualisieren ließen. Die limitierte Kollektion ist längst ausverkauft und taucht nur noch gebraucht auf. Ein kurioses Kapitel LEGO-Modegeschichte mit Sammlerpotenzial.",
      en: "Jackets, hoodies and jeans with sewn-on stud plates that could be customized with real LEGO elements. The limited collection is long sold out and only surfaces second-hand. A curious chapter of LEGO fashion history with collector potential.",
    },
    emoji: "🧥",
  },
  {
    id: "lego-watch-system",
    name: { de: "LEGO Armbanduhren (Watch System)", en: "LEGO watches (Watch System)" },
    kind: "merch",
    year: null,
    priceEUR: 25,
    description: {
      de: "Uhren mit baubarem Gliederarmband, dessen Segmente sich wie Steine kombinieren lassen, von Kinderuhren mit Minifigur bis zu Themen wie Star Wars und Ninjago. Die Lizenz-Reihe von ClicTime wird nicht mehr produziert. Originalverpackte Exemplare mit Figur sind ein hübsches Nischen-Sammelgebiet.",
      en: "Watches with a buildable link strap whose segments combine like bricks, from kids' watches with a minifigure to themes like Star Wars and Ninjago. The ClicTime license line is no longer produced. Boxed examples with the figure make a neat niche collecting field.",
    },
    emoji: "⌚",
  },
  {
    id: "lego-minifigur-schluesselanhaenger",
    name: { de: "LEGO Minifiguren-Schlüsselanhänger", en: "LEGO minifigure key chains" },
    kind: "merch",
    year: null,
    priceEUR: 6,
    description: {
      de: "Echte Minifiguren mit Kettenöse, von Darth Vader bis zum klassischen Bauarbeiter, dazu LED-Varianten mit Leuchtfüßen. Achtung fürs Sammeln: Die Öse ist fest im Kopf verankert, als Figurenersatz taugen sie nur bedingt. Der Fantasia-Sammlerkatalog führte Schlüsselanhänger sogar als eigene Sammelkategorie.",
      en: "Real minifigures with a chain loop, from Darth Vader to the classic construction worker, plus LED versions with light-up feet. Collector caveat: the loop is anchored firmly in the head, so they only partly work as figure substitutes. The Fantasia collector catalog even listed key chains as their own collecting category.",
    },
    emoji: "🔑",
  },
  {
    id: "lego-2x4-tasse",
    name: { de: "LEGO Stein-Tasse (2x4 Brick Mug)", en: "LEGO brick mug (2x4 upscaled)" },
    kind: "merch",
    year: null,
    priceEUR: 15,
    description: {
      de: "Kaffeebecher im Look eines hochskalierten 2x4-Steins, in klassischem Rot, Gelb oder Blau. Es gab über die Jahre mehrere offizielle Varianten, teils mit Noppen, auf denen sich tatsächlich bauen lässt. Das Standard-Geschenk, mit dem viele AFOL-Schreibtische anfangen.",
      en: "A coffee mug styled as an upscaled 2x4 brick, in classic red, yellow or blue. Several official variants have existed over the years, some with studs you can actually build on. The default gift that starts many an AFOL desk.",
    },
    emoji: "☕",
  },
  {
    id: "lego-pluesch-minifigur",
    name: { de: "LEGO Plüsch-Minifiguren (Manhattan Toy)", en: "LEGO plush minifigures (Manhattan Toy)" },
    kind: "merch",
    year: 2024,
    priceEUR: 30,
    description: {
      de: "Offiziell lizenzierte Plüsch-Versionen klassischer Minifiguren, unter anderem Astronaut, Skelett und Pirat, umgesetzt von Manhattan Toy. Die kantige Minifiguren-Silhouette bleibt auch in weich erstaunlich gut erkennbar. Daneben verkaufen die LEGOLAND-Parks eigene Plüsch-Exklusivitäten, die selten online auftauchen.",
      en: "Officially licensed plush versions of classic minifigures, including astronaut, skeleton and pirate, made by Manhattan Toy. The angular minifigure silhouette stays surprisingly recognizable in soft form. LEGOLAND parks also sell their own plush exclusives that rarely show up online.",
    },
    emoji: "🧸",
  },
  {
    id: "lego-cap",
    name: { de: "LEGO Caps & Basecaps", en: "LEGO caps & baseball hats" },
    kind: "merch",
    year: null,
    priceEUR: 20,
    description: {
      de: "Offizielle Kappen mit Logo-Patch oder Minifiguren-Motiven, teils aus den LEGO-Stores und Parks, teils aus der Kinderlinie LEGO Wear (Kabooki). Store-exklusive Designs von Events wie Comic Cons sind kleine Sammlerstücke. Wer im LEGO House in Billund kauft, trägt das seltenste Souvenir.",
      en: "Official caps with logo patches or minifigure motifs, some from LEGO stores and parks, some from the LEGO Wear kids' line (Kabooki). Store-exclusive designs from events like comic cons are small collectibles. Buy at LEGO House in Billund and you wear the rarest souvenir.",
    },
    emoji: "🧢",
  },
  {
    id: "displate-lego-metallposter",
    name: { de: "LEGO Metall-Poster (Displate)", en: "LEGO metal posters (Displate)" },
    kind: "merch",
    year: null,
    priceEUR: 45,
    description: {
      de: "Offiziell lizenzierte Wandbilder auf Metall mit Motiven von Klassik-Sets, Box-Art und Minifiguren-Kunst, teils als nummerierte Limited Editions. Die limitierten Motive sind nach dem Ausverkauf regelmäßig Sammlerware. Magnetmontage ohne Bohren macht sie auch fürs Mietwohnungs-LEGO-Zimmer tauglich.",
      en: "Officially licensed metal wall art featuring classic set motifs, box art and minifigure artwork, partly as numbered limited editions. The limited designs regularly become collector items once sold out. Magnetic mounting without drilling suits the rented-flat LEGO room too.",
    },
    emoji: "🎨",
  },
];
