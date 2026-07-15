import type { Minifig } from "./types";

// Recherchierte Minifiguren-Daten (Stand Juli 2026). Preise sind Schätzwerte in EUR,
// orientiert an BrickLink-/BrickEconomy-/Brick-Ranker-Preisniveaus (neu/versiegelt
// bzw. gebraucht/lose). Einige Legacy-IDs sind BrickLink-artige Näherungen; bei
// Promo-Exklusiven dient die Promo-Setnummer (z. B. "comcon028") als ID.
//
// imageUrl zeigt IMMER auf das Rebrickable-CDN-Bild der zugeordneten
// Katalog-Figur (fig-XXXXXX) - NICHT auf BrickLink raten! Die alten
// img.bricklink.com-URLs zeigten in 19 von 29 Fällen falsche Figuren
// (z. B. cas212 = grüner Ninja statt Schwarzer Falke). Jede Figur ist über
// appearsInSetIds im Katalog-Inventar verankert. Konsistenz prüfbar
// mit: node scripts/check-curated-figs.mjs
//
// rarity "ultra-rare" ist der Legenden-Status: nur diese Figuren erscheinen
// auf /legenden. Quellen für Marktwerte der Legenden: BrickEconomy,
// minifigpriceguide.com (Top 100), brickranker.com (SDCC-Ranking),
// brickfanatics.com (SDCC-Grails) - recherchiert Juli 2026.
export const MINIFIGS: Minifig[] = [
  // ── Star Wars ────────────────────────────────────────────────────────────
  {
    id: "sw0107",
    name: { de: "Boba Fett (Cloud City)", en: "Boba Fett (Cloud City)" },
    theme: "Star Wars",
    firstYear: 2003,
    appearsInSetIds: ["10123"],
    rarity: "ultra-rare",
    valueNewEUR: 1150,
    valueUsedEUR: 680,
    priceHistory: [
      { year: 2012, priceEUR: 250 },
      { year: 2017, priceEUR: 520 },
      { year: 2021, priceEUR: 850 },
      { year: 2026, priceEUR: 1150 },
    ],
    description: {
      de: "Eine der begehrtesten Star-Wars-Minifiguren überhaupt: der erste Boba Fett mit Arm- und Beinbedruckung, exklusiv im Cloud-City-Set 10123 von 2003 enthalten. Der geringe Produktionsumfang des Sets macht die Figur zum Grail für Sammler.",
      en: "One of the most sought-after Star Wars minifigures ever: the first Boba Fett with printed arms and legs, exclusive to the 2003 Cloud City set 10123. The set's small production run makes this figure a true grail for collectors.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-003908.jpg",
  },
  {
    id: "sw0218",
    name: { de: "Darth Vader (Chrom-Schwarz)", en: "Darth Vader (Chrome Black)" },
    theme: "Star Wars",
    firstYear: 2009,
    appearsInSetIds: ["4547551"],
    rarity: "ultra-rare",
    valueNewEUR: 1900,
    valueUsedEUR: 950,
    priceHistory: [
      { year: 2014, priceEUR: 400 },
      { year: 2018, priceEUR: 800 },
      { year: 2022, priceEUR: 1400 },
      { year: 2026, priceEUR: 1900 },
    ],
    description: {
      de: "Streng limitierte Promo-Figur zum 10. Jubiläum von LEGO Star Wars (2009), nur in versiegelten Polybags verteilt. Verchromte Vader-Figuren in ungeöffneter Tüte zählen heute zu den teuersten Minifiguren am Markt.",
      en: "Strictly limited promo figure for the 10th anniversary of LEGO Star Wars (2009), distributed only in sealed polybags. Chrome Vaders in unopened bags rank among the most expensive minifigures on the market today.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000581.jpg",
  },
  {
    id: "sw0004",
    name: { de: "Darth Vader (Klassik 1999)", en: "Darth Vader (Classic 1999)" },
    theme: "Star Wars",
    firstYear: 1999,
    appearsInSetIds: ["7150", "7152", "3451"],
    rarity: "uncommon",
    valueNewEUR: 45,
    valueUsedEUR: 22,
    priceHistory: [
      { year: 2016, priceEUR: 25 },
      { year: 2021, priceEUR: 35 },
      { year: 2026, priceEUR: 45 },
    ],
    description: {
      de: "Der allererste LEGO-Darth-Vader aus dem Startjahr der Lizenz 1999 - mit dem klassischen glatten Helm und ohne Gesichtsbedruckung unter der Maske. Ein erschwingliches Stück LEGO-Star-Wars-Geschichte.",
      en: "The very first LEGO Darth Vader from the license's launch year 1999 - with the classic smooth helmet and no face print under the mask. An affordable piece of LEGO Star Wars history.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-003517.jpg",
  },
  {
    id: "sw0105",
    name: { de: "Lando Calrissian (Cloud City)", en: "Lando Calrissian (Cloud City)" },
    theme: "Star Wars",
    firstYear: 2003,
    appearsInSetIds: ["10123"],
    rarity: "rare",
    valueNewEUR: 320,
    valueUsedEUR: 170,
    priceHistory: [
      { year: 2014, priceEUR: 90 },
      { year: 2019, priceEUR: 180 },
      { year: 2026, priceEUR: 320 },
    ],
    description: {
      de: "Der erste Lando Calrissian überhaupt, exklusiv im Cloud-City-Set 10123. Steht im Schatten des Cloud-City-Boba-Fett, ist aber selbst eine vierstellige Rarität im ungeöffneten Set und lose ein gesuchtes Sammlerstück.",
      en: "The first-ever Lando Calrissian, exclusive to Cloud City set 10123. Overshadowed by the Cloud City Boba Fett, but a sought-after collectible in its own right.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-003910.jpg",
  },
  {
    id: "sw0028",
    name: { de: "R2-D2 (klassisch)", en: "R2-D2 (classic)" },
    theme: "Star Wars",
    firstYear: 1999,
    appearsInSetIds: ["7140", "10188", "75192"],
    rarity: "common",
    valueNewEUR: 14,
    valueUsedEUR: 7,
    priceHistory: [
      { year: 2016, priceEUR: 8 },
      { year: 2021, priceEUR: 11 },
      { year: 2026, priceEUR: 14 },
    ],
    description: {
      de: "Der treue Astromech in seiner klassischen Druckvariante - seit 1999 in unzähligen Sets erschienen und trotzdem in keiner Sammlung verzichtbar. Spätere Sets nutzen leicht abgewandelte Druckvarianten.",
      en: "The loyal astromech in his classic print variant - featured in countless sets since 1999, yet indispensable in any collection. Later sets use slightly revised prints.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-003508.jpg",
  },
  {
    id: "sw0275",
    name: { de: "Boba Fett (weiß, 30 Jahre)", en: "Boba Fett (white, 30th anniversary)" },
    theme: "Star Wars",
    firstYear: 2010,
    appearsInSetIds: ["2853835"],
    rarity: "ultra-rare",
    valueNewEUR: 320,
    valueUsedEUR: 180,
    priceHistory: [
      { year: 2014, priceEUR: 120 },
      { year: 2019, priceEUR: 200 },
      { year: 2023, priceEUR: 260 },
      { year: 2026, priceEUR: 320 },
    ],
    description: {
      de: "Weißer Prototyp-Boba-Fett als Promo zum 30. Jubiläum des Kopfgeldjägers (2010), nur als limitierte Beigabe verteilt. Im versiegelten Polybag ein Klassiker jeder Minifiguren-Wertanlage-Liste.",
      en: "White prototype Boba Fett released as a promo for the bounty hunter's 30th anniversary (2010), distributed only as a limited giveaway. Sealed in its polybag, a staple of every minifigure investment list.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000316.jpg",
  },
  {
    id: "sw1350",
    name: { de: "Jedi Bob", en: "Jedi Bob" },
    theme: "Star Wars",
    firstYear: 2024,
    appearsInSetIds: ["75388"],
    rarity: "uncommon",
    valueNewEUR: 19,
    valueUsedEUR: 11,
    priceHistory: [
      { year: 2024, priceEUR: 12 },
      { year: 2026, priceEUR: 19 },
    ],
    description: {
      de: "Die Kultfigur der Community: Nach über 20 Jahren als Running Gag bekam Jedi Bob 2024 mit Set 75388 ein eigenes Set. Da das Set laut EOL-Listen im Sommer 2026 ausläuft, gilt die Figur als Kandidat für künftige Wertsteigerung.",
      en: "The community's cult hero: after 20+ years as a running gag, Jedi Bob finally got his own set (75388) in 2024. With the set retiring in summer 2026 according to EOL lists, the figure is seen as a candidate for future appreciation.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-015324.jpg",
  },

  // ── Classic Space & Space ────────────────────────────────────────────────
  {
    id: "sp004",
    name: { de: "Classic Spaceman (rot)", en: "Classic Spaceman (red)" },
    theme: "Space",
    firstYear: 1978,
    appearsInSetIds: ["928", "918", "924"],
    rarity: "uncommon",
    valueNewEUR: 26,
    valueUsedEUR: 10,
    priceHistory: [
      { year: 2014, priceEUR: 12 },
      { year: 2020, priceEUR: 18 },
      { year: 2026, priceEUR: 26 },
    ],
    description: {
      de: "Der rote Classic-Space-Astronaut mit Logo-Torso ist seit 1978 das Gesicht der klassischen Weltraum-Ära. Exemplare ohne gebrochene Helmklammer und mit kräftigem Torso-Druck erzielen deutliche Aufschläge.",
      en: "The red Classic Space astronaut with the logo torso has been the face of the classic space era since 1978. Examples without cracked helmets and with crisp torso prints command clear premiums.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000020.jpg",
  },
  {
    id: "sp006",
    name: { de: "Classic Spaceman (gelb)", en: "Classic Spaceman (yellow)" },
    theme: "Space",
    firstYear: 1979,
    appearsInSetIds: ["0015", "6980"],
    rarity: "uncommon",
    valueNewEUR: 30,
    valueUsedEUR: 12,
    priceHistory: [
      { year: 2014, priceEUR: 14 },
      { year: 2020, priceEUR: 21 },
      { year: 2026, priceEUR: 30 },
    ],
    description: {
      de: "Der gelbe Klassik-Astronaut, spätestens seit Benny aus dem LEGO Movie weltberühmt. Er erschien ab 1979 in Minifiguren-Packs und flog später in Sets wie dem Galaxy Commander (6980) mit - etwas schwerer zu finden als die rote Variante.",
      en: "The yellow classic astronaut, world-famous at the latest since Benny from The LEGO Movie. Released from 1979 in minifigure packs, he later crewed sets like the Galaxy Commander (6980) - somewhat harder to find than the red variant.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-006908.jpg",
  },
  {
    id: "sp033",
    name: { de: "M:Tron-Astronaut", en: "M:Tron Astronaut" },
    theme: "Space",
    firstYear: 1990,
    appearsInSetIds: ["6989", "6956"],
    rarity: "uncommon",
    valueNewEUR: 18,
    valueUsedEUR: 8,
    priceHistory: [
      { year: 2016, priceEUR: 8 },
      { year: 2021, priceEUR: 13 },
      { year: 2026, priceEUR: 18 },
    ],
    description: {
      de: "Die rot-schwarze Crew der Magnet-Fraktion M:Tron (ab 1990) gehört zu den beliebtesten Space-Figuren der frühen 90er. Der Torso mit M-Logo ist erstaunlich kratzempfindlich - gute Exemplare werden knapper.",
      en: "The red-and-black crew of the magnet faction M:Tron (from 1990) is among the most popular Space figures of the early 90s. The M-logo torso scratches easily, making clean examples increasingly scarce.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000065.jpg",
  },
  {
    id: "tlm026",
    name: { de: "Benny", en: "Benny" },
    theme: "The LEGO Movie",
    firstYear: 2014,
    appearsInSetIds: ["70816", "70841"],
    rarity: "uncommon",
    valueNewEUR: 22,
    valueUsedEUR: 11,
    priceHistory: [
      { year: 2016, priceEUR: 10 },
      { year: 2021, priceEUR: 16 },
      { year: 2026, priceEUR: 22 },
    ],
    description: {
      de: "\"SPACESHIP!\" - Benny, der 1980er-Astronaut mit gebrochener Helmklammer, ist die liebevollste Hommage an die Classic-Space-Ära. Sein Raumschiff-Set 70816 gilt als moderner Klassiker.",
      en: "\"SPACESHIP!\" - Benny, the 1980-something space guy with the cracked helmet, is the most affectionate homage to the Classic Space era. His Spaceship set 70816 is considered a modern classic.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-007014.jpg",
  },

  // ── Pirates & Castle ─────────────────────────────────────────────────────
  {
    id: "pi001",
    name: { de: "Captain Rotbart", en: "Captain Red Beard" },
    theme: "Pirates",
    firstYear: 1989,
    appearsInSetIds: ["6285", "6286"],
    rarity: "rare",
    valueNewEUR: 60,
    valueUsedEUR: 28,
    priceHistory: [
      { year: 2014, priceEUR: 22 },
      { year: 2020, priceEUR: 40 },
      { year: 2026, priceEUR: 60 },
    ],
    description: {
      de: "Der legendäre Piratenkapitän mit Holzbein, Hakenhand und Epauletten führte 1989 das Piraten-Thema ein - die erste LEGO-Figur mit individuellem Gesicht. Kapitän der Black Seas Barracuda.",
      en: "The legendary pirate captain with peg leg, hook hand and epaulettes launched the Pirates theme in 1989 - the first LEGO figure with an individual face. Captain of the Black Seas Barracuda.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-005262.jpg",
  },
  {
    id: "cas085",
    name: { de: "Ritter der Gelben Burg", en: "Yellow Castle Knight" },
    theme: "Castle",
    firstYear: 1978,
    appearsInSetIds: ["375"],
    rarity: "rare",
    valueNewEUR: 48,
    valueUsedEUR: 20,
    priceHistory: [
      { year: 2014, priceEUR: 18 },
      { year: 2020, priceEUR: 32 },
      { year: 2026, priceEUR: 48 },
    ],
    description: {
      de: "Die Ritter der Gelben Burg von 1978 gehören zur allerersten Minifiguren-Generation - mit einfarbigen Torsos, aufsteckbaren Kunststoff-Visieren und Pferden aus Steinen. Ein Stück LEGO-Urgeschichte.",
      en: "The knights of the 1978 Yellow Castle belong to the very first minifigure generation - with plain torsos, clip-on plastic visors and brick-built horses. A piece of LEGO prehistory.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-004433.jpg",
  },
  {
    id: "cas124",
    name: { de: "Löwenritter (Crusader)", en: "Crusader Lion Knight" },
    theme: "Castle",
    firstYear: 1984,
    appearsInSetIds: ["6080", "6083"],
    rarity: "uncommon",
    valueNewEUR: 24,
    valueUsedEUR: 10,
    priceHistory: [
      { year: 2016, priceEUR: 10 },
      { year: 2021, priceEUR: 17 },
      { year: 2026, priceEUR: 24 },
    ],
    description: {
      de: "Der klassische Löwenwappen-Ritter der 80er verteidigte die King's Castle 6080 und prägte eine ganze Generation von Burgen-Fans. Saubere Wappendrucke sind der wertbestimmende Faktor.",
      en: "The classic lion-crest knight of the 80s defended King's Castle 6080 and shaped a whole generation of castle fans. Crisp crest printing is the key value factor.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-004570.jpg",
  },
  {
    id: "cas212",
    name: { de: "Schwarzer Falke", en: "Black Falcon Knight" },
    theme: "Castle",
    firstYear: 1984,
    appearsInSetIds: ["6074", "10305"],
    rarity: "uncommon",
    valueNewEUR: 32,
    valueUsedEUR: 14,
    priceHistory: [
      { year: 2016, priceEUR: 14 },
      { year: 2021, priceEUR: 22 },
      { year: 2026, priceEUR: 32 },
    ],
    description: {
      de: "Die Schwarzen Falken sind die wohl kultigste Castle-Fraktion - so beliebt, dass LEGO sie 2022 in der Lion Knights' Castle (10305) offiziell zurückbrachte. Originale aus den 80ern bleiben trotzdem gefragt.",
      en: "The Black Falcons are arguably the most iconic Castle faction - so popular that LEGO officially brought them back in the 2022 Lion Knights' Castle (10305). Original 80s figures remain in demand regardless.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000642.jpg",
  },
  {
    id: "cas572",
    name: { de: "Königin der Löwenritter", en: "Lion Knights' Queen" },
    theme: "Castle",
    firstYear: 2022,
    appearsInSetIds: ["10305"],
    rarity: "uncommon",
    valueNewEUR: 15,
    valueUsedEUR: 9,
    priceHistory: [
      { year: 2023, priceEUR: 10 },
      { year: 2026, priceEUR: 15 },
    ],
    description: {
      de: "Die Königin aus der 90-Jahre-Jubiläumsburg 10305 - eine moderne Hommage an die Crusader der 80er. Seit dem Auslaufen der Burg Ende 2025 zieht der Kurs der exklusiven Figuren spürbar an.",
      en: "The queen from the 90th-anniversary castle 10305 - a modern homage to the 80s Crusaders. Since the castle retired at the end of 2025, prices for its exclusive figures have been climbing noticeably.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-012995.jpg",
  },

  // ── Trains & Town/Modular ────────────────────────────────────────────────
  {
    id: "trn001",
    name: { de: "Lokführer (12V-Ära)", en: "Train Driver (12V era)" },
    theme: "Trains",
    firstYear: 1980,
    appearsInSetIds: ["7740", "7735"],
    rarity: "uncommon",
    valueNewEUR: 20,
    valueUsedEUR: 8,
    priceHistory: [
      { year: 2016, priceEUR: 9 },
      { year: 2021, priceEUR: 14 },
      { year: 2026, priceEUR: 20 },
    ],
    description: {
      de: "Der Lokführer der grauen 12-Volt-Ära mit blauer Uniform und Mütze gehört zu den Figuren, die Eisenbahn-Nostalgie pur verkörpern. Häufig bespielt - neuwertige Exemplare sind rar.",
      en: "The driver of the grey 12-volt era with blue uniform and cap embodies pure railway nostalgia. Usually well-played - mint examples are scarce.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-001010.jpg",
  },
  {
    id: "trn241",
    name: { de: "Schaffner (Emerald Night)", en: "Conductor (Emerald Night)" },
    theme: "Trains",
    firstYear: 2009,
    appearsInSetIds: ["10194"],
    rarity: "rare",
    valueNewEUR: 36,
    valueUsedEUR: 18,
    priceHistory: [
      { year: 2016, priceEUR: 14 },
      { year: 2021, priceEUR: 25 },
      { year: 2026, priceEUR: 36 },
    ],
    description: {
      de: "Der elegante Schaffner der Emerald Night (10194) mit dunkelgrüner Uniform - exklusiv in einem der beliebtesten LEGO-Züge aller Zeiten. Wird oft für MOC-Bahnhöfe gesucht.",
      en: "The elegant conductor of the Emerald Night (10194) in dark green uniform - exclusive to one of the most beloved LEGO trains of all time. Frequently hunted for MOC stations.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-009171.jpg",
  },
  {
    id: "twn123",
    name: { de: "Concierge (Café Corner)", en: "Concierge (Café Corner)" },
    theme: "Modular Buildings",
    firstYear: 2007,
    appearsInSetIds: ["10182"],
    rarity: "rare",
    valueNewEUR: 42,
    valueUsedEUR: 20,
    priceHistory: [
      { year: 2016, priceEUR: 16 },
      { year: 2021, priceEUR: 28 },
      { year: 2026, priceEUR: 42 },
    ],
    description: {
      de: "Eine der drei schlichten Figuren aus dem allerersten Modular Building Café Corner (10182). Ihr Wert speist sich fast ausschließlich aus der Herkunft - komplette Figurensätze des Sets sind gesucht.",
      en: "One of the three plain figures from the very first modular building, Café Corner (10182). Its value stems almost entirely from provenance - complete figure sets are in demand.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-008381.jpg",
  },
  {
    id: "twn133",
    name: { de: "Feuerwehrmann (Fire Brigade)", en: "Firefighter (Fire Brigade)" },
    theme: "Modular Buildings",
    firstYear: 2009,
    appearsInSetIds: ["10197"],
    rarity: "uncommon",
    valueNewEUR: 16,
    valueUsedEUR: 7,
    priceHistory: [
      { year: 2016, priceEUR: 7 },
      { year: 2021, priceEUR: 11 },
      { year: 2026, priceEUR: 16 },
    ],
    description: {
      de: "Feuerwehrmann aus der Fire Brigade (10197), dem Retro-Feuerwehrhaus der Modular-Reihe im Stil der 1930er. Mit Dalmatiner-Kollege einer der charmantesten Figurensätze der Serie.",
      en: "Firefighter from the Fire Brigade (10197), the modular line's 1930s-style retro fire house. Together with the Dalmatian colleague, one of the series' most charming figure sets.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-008364.jpg",
  },

  // ── Collectible Minifigures ──────────────────────────────────────────────
  {
    id: "col071",
    name: { de: "Mr. Gold", en: "Mr. Gold" },
    theme: "Collectible Minifigures",
    firstYear: 2013,
    appearsInSetIds: ["71001"],
    rarity: "ultra-rare",
    valueNewEUR: 4800,
    valueUsedEUR: 3200,
    priceHistory: [
      { year: 2015, priceEUR: 1200 },
      { year: 2019, priceEUR: 2400 },
      { year: 2023, priceEUR: 3800 },
      { year: 2026, priceEUR: 4800 },
    ],
    description: {
      de: "Nur 5.000 Stück weltweit: Mr. Gold wurde 2013 zufällig in Tüten der Minifiguren-Serie 10 versteckt und ist heute die berühmteste Chase-Figur der LEGO-Geschichte. Exemplare mit Zertifikatsnummer und Originaltüte erzielen Höchstpreise.",
      en: "Only 5,000 pieces worldwide: Mr. Gold was randomly hidden in Series 10 blind bags in 2013 and is now the most famous chase figure in LEGO history. Examples with certificate number and original bag command top prices.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000825.jpg",
  },
  {
    id: "col005",
    name: { de: "Zombie (Serie 1)", en: "Zombie (Series 1)" },
    theme: "Collectible Minifigures",
    firstYear: 2010,
    appearsInSetIds: ["8683"],
    rarity: "rare",
    valueNewEUR: 68,
    valueUsedEUR: 34,
    priceHistory: [
      { year: 2014, priceEUR: 25 },
      { year: 2020, priceEUR: 45 },
      { year: 2026, priceEUR: 68 },
    ],
    description: {
      de: "Der Zombie aus der allerersten Sammelfiguren-Serie von 2010 - mit Hühnerkeule und leerem Blick ein Fanliebling. Serie-1-Figuren in ungeöffneter Tüte werden von Jahr zu Jahr teurer.",
      en: "The Zombie from the very first collectible minifigure series of 2010 - a fan favourite with turkey leg and vacant stare. Series 1 figures in unopened bags get pricier every year.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-001182.jpg",
  },
  {
    id: "col089",
    name: { de: "Freiheitsstatue (Serie 6)", en: "Lady Liberty (Series 6)" },
    theme: "Collectible Minifigures",
    firstYear: 2012,
    appearsInSetIds: ["8827"],
    rarity: "rare",
    valueNewEUR: 95,
    valueUsedEUR: 48,
    priceHistory: [
      { year: 2015, priceEUR: 30 },
      { year: 2020, priceEUR: 60 },
      { year: 2026, priceEUR: 95 },
    ],
    description: {
      de: "Die Freiheitsstatue aus Serie 6 ist komplett in Sand-Grün gehalten und dadurch eine beliebte Teilequelle für MOC-Bauer - was den Preis zusätzlich treibt. Eine der teuersten regulären CMF-Figuren.",
      en: "Series 6 Lady Liberty is moulded entirely in sand green, making her a popular parts source for MOC builders - which drives the price further. One of the most expensive regular CMF figures.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-008416.jpg",
  },

  // ── Harry Potter ─────────────────────────────────────────────────────────
  {
    id: "hp001",
    name: { de: "Harry Potter (2001)", en: "Harry Potter (2001)" },
    theme: "Harry Potter",
    firstYear: 2001,
    appearsInSetIds: ["4708", "4709", "4714"],
    rarity: "uncommon",
    valueNewEUR: 38,
    valueUsedEUR: 16,
    priceHistory: [
      { year: 2015, priceEUR: 14 },
      { year: 2021, priceEUR: 26 },
      { year: 2026, priceEUR: 38 },
    ],
    description: {
      de: "Der erste LEGO-Harry aus der gelben Ära von 2001, erschienen zum Kinostart des ersten Films. Für viele Sammler der nostalgischste Harry - die gelbe Hautfarbe wurde 2004 durch Fleischtöne abgelöst.",
      en: "The first LEGO Harry from the yellow era of 2001, released alongside the first film. The most nostalgic Harry for many collectors - yellow skin was replaced by flesh tones in 2004.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-006060.jpg",
  },
  {
    id: "hp101",
    name: { de: "Rubeus Hagrid", en: "Rubeus Hagrid" },
    theme: "Harry Potter",
    firstYear: 2010,
    appearsInSetIds: ["4738", "4842"],
    rarity: "uncommon",
    valueNewEUR: 30,
    valueUsedEUR: 15,
    priceHistory: [
      { year: 2016, priceEUR: 12 },
      { year: 2021, priceEUR: 22 },
      { year: 2026, priceEUR: 30 },
    ],
    description: {
      de: "Hagrid mit seinem großen Spezial-Körperelement aus der 2010er-Welle, u. a. im Hogwarts-Schloss 4842 enthalten. Großfiguren wie diese sind bei Komplettierern besonders gefragt.",
      en: "Hagrid with his big special body element from the 2010 wave, included in Hogwarts Castle 4842 among others. Oversized figures like this are especially popular with completionists.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-006075.jpg",
  },
  {
    id: "hp790",
    name: { de: "Molly Weasley (Fuchsbau CE)", en: "Molly Weasley (Burrow CE)" },
    theme: "Harry Potter",
    firstYear: 2024,
    appearsInSetIds: ["76437"],
    rarity: "uncommon",
    valueNewEUR: 13,
    valueUsedEUR: 8,
    priceHistory: [
      { year: 2024, priceEUR: 9 },
      { year: 2026, priceEUR: 13 },
    ],
    description: {
      de: "Molly Weasley aus der Collectors' Edition des Fuchsbaus (76437) mit exklusivem Strickjacken-Druck. Das Set steht auf den EOL-Listen für Ende 2026 - Figuren-Preise dürften danach anziehen.",
      en: "Molly Weasley from the Burrow Collectors' Edition (76437) with an exclusive cardigan print. The set is slated for retirement at the end of 2026 - figure prices are likely to rise afterwards.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-015477.jpg",
  },

  // ── Disney & City ────────────────────────────────────────────────────────
  {
    id: "dis001",
    name: { de: "Micky Maus", en: "Mickey Mouse" },
    theme: "Disney",
    firstYear: 2016,
    appearsInSetIds: ["71012", "71044"],
    rarity: "uncommon",
    valueNewEUR: 18,
    valueUsedEUR: 9,
    priceHistory: [
      { year: 2018, priceEUR: 9 },
      { year: 2022, priceEUR: 13 },
      { year: 2026, priceEUR: 18 },
    ],
    description: {
      de: "Micky in seiner klassischen Minifiguren-Form, u. a. als Lokführer im Disney-Zug mit Bahnhof (71044). Der spezielle Kopfform-Guss macht ihn zu einem der markantesten Lizenz-Designs.",
      en: "Mickey in his classic minifigure form, appearing as the engineer of the Disney Train and Station (71044) among others. The special head mould makes him one of the most distinctive licensed designs.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-005752.jpg",
  },
  {
    id: "cty1500",
    name: { de: "Lokführerin (Express-Zug)", en: "Train Driver (Express Train)" },
    theme: "City",
    firstYear: 2022,
    appearsInSetIds: ["60337"],
    rarity: "common",
    valueNewEUR: 5,
    valueUsedEUR: 3,
    priceHistory: [
      { year: 2023, priceEUR: 3 },
      { year: 2026, priceEUR: 5 },
    ],
    description: {
      de: "Die Lokführerin des Hochgeschwindigkeitszugs 60337 in moderner City-Bahn-Uniform. Noch eine Alltagsfigur - mit dem EOL des letzten großen Personenzugs Ende 2026 könnte sich das ändern.",
      en: "The driver of high-speed train 60337 in a modern City rail uniform. Still an everyday figure - that may change once the last big passenger train retires at the end of 2026.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-012808.jpg",
  },
  {
    id: "cty1789",
    name: { de: "Straßenbahnfahrer", en: "Streetcar Driver" },
    theme: "City",
    firstYear: 2024,
    appearsInSetIds: ["60423"],
    rarity: "common",
    valueNewEUR: 5,
    valueUsedEUR: 3,
    priceHistory: [
      { year: 2024, priceEUR: 3 },
      { year: 2026, priceEUR: 5 },
    ],
    description: {
      de: "Der freundliche Fahrer der Innenstadt-Straßenbahn 60423 - perfekt für jede LEGO-Stadt mit Nahverkehr. Das Set läuft laut EOL-Listen Ende 2026 aus.",
      en: "The friendly driver of downtown streetcar 60423 - perfect for any LEGO city with public transport. The set retires at the end of 2026 according to EOL lists.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-015350.jpg",
  },

  // ═════════════════════════════════════════════════════════════════════════
  // LEGENDEN-AUSBAU (Juli 2026): echte Grail-Figuren mit 100+ EUR Marktwert.
  // Preisniveaus: brickranker.com "All LEGO SDCC Minifigures Ranked By Value",
  // brickfanatics.com "The 10 most valuable LEGO SDCC minifigures",
  // minifigpriceguide.com Top 100, BrickEconomy (jeweils Juli 2026 gesichtet).
  // valueNewEUR = neu/versiegelt bzw. original verpackt, valueUsedEUR = lose.
  //
  // Bild-Hinweis: Für viele Promo-Exklusive hat Rebrickable KEIN Figurenfoto
  // (fig-XXXXXX.jpg liefert 404). Dort wird das Rebrickable-SET-Foto des
  // Ein-Figuren-Promo-Sets verwendet (z. B. comcon028-1.jpg) - ebenfalls vom
  // Rebrickable-CDN und über appearsInSetIds verankert. Alle Bilder wurden
  // am 15.07.2026 visuell gegen die Beschreibung geprüft.
  // ═════════════════════════════════════════════════════════════════════════

  // ── Star Wars Grails (Promos & Chrom) ────────────────────────────────────
  // Quelle: minifigpriceguide Top 100, BrickEconomy; 10.000 Stück 2007 zufällig
  // in Star-Wars-Sets versteckt (30 Jahre Star Wars).
  {
    id: "sw0158",
    name: { de: "C-3PO (Chrom-Gold)", en: "C-3PO (Chrome Gold)" },
    theme: "Star Wars",
    firstYear: 2007,
    appearsInSetIds: ["4521221"],
    rarity: "ultra-rare",
    valueNewEUR: 1100,
    valueUsedEUR: 480,
    priceHistory: [
      { year: 2014, priceEUR: 300 },
      { year: 2019, priceEUR: 550 },
      { year: 2023, priceEUR: 850 },
      { year: 2026, priceEUR: 1100 },
    ],
    description: {
      de: "Zum 30. Star-Wars-Jubiläum 2007 versteckte LEGO 10.000 verchromte Gold-C-3POs zufällig in Sets - dazu kamen fünf Exemplare aus massivem 14-Karat-Gold. Der Chrom-Droide im versiegelten Beutel ist ein fester Bestandteil jeder Grail-Liste.",
      en: "For the 30th anniversary of Star Wars in 2007, LEGO randomly hid 10,000 chrome gold C-3POs in sets - plus five made of solid 14-karat gold. The chrome droid in its sealed bag is a fixture on every grail list.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000571.jpg",
  },
  // Quelle: BrickEconomy/minifigpriceguide; Promo-Polybag zum 10. Jubiläum
  // von LEGO Star Wars (2009), zusätzlich als Magnet-Version verteilt.
  {
    id: "sw0097",
    name: { de: "Stormtrooper (Chrom-Silber)", en: "Stormtrooper (Chrome Silver)" },
    theme: "Star Wars",
    firstYear: 2009,
    appearsInSetIds: ["2853590", "852737"],
    rarity: "ultra-rare",
    valueNewEUR: 380,
    valueUsedEUR: 90,
    priceHistory: [
      { year: 2014, priceEUR: 90 },
      { year: 2019, priceEUR: 180 },
      { year: 2023, priceEUR: 290 },
      { year: 2026, priceEUR: 380 },
    ],
    description: {
      de: "Der verchromte Stormtrooper wurde 2009 zum 10. Geburtstag von LEGO Star Wars als Promo-Polybag verteilt - das silberne Gegenstück zum Chrom-Vader. Versiegelte Beutel haben ihren Wert seit 2014 mehr als vervierfacht.",
      en: "The chrome-plated Stormtrooper was given away in 2009 as a promo polybag for the 10th birthday of LEGO Star Wars - the silver counterpart to the chrome Vader. Sealed bags have more than quadrupled in value since 2014.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000312.jpg",
  },
  // Quelle: BrickEconomy; May-the-4th-Promo-Polybag 2012, einzige TC-14-Figur.
  {
    id: "sw0385",
    name: { de: "TC-14", en: "TC-14" },
    theme: "Star Wars",
    firstYear: 2012,
    appearsInSetIds: ["5000063"],
    rarity: "ultra-rare",
    valueNewEUR: 210,
    valueUsedEUR: 65,
    priceHistory: [
      { year: 2016, priceEUR: 60 },
      { year: 2020, priceEUR: 110 },
      { year: 2023, priceEUR: 160 },
      { year: 2026, priceEUR: 210 },
    ],
    description: {
      de: "Der verchromte Protokolldroide der Handelsföderation gab es 2012 nur als May-the-4th-Promo-Polybag ab einem Mindesteinkauf im LEGO Shop. Bis heute die einzige TC-14-Minifigur - versiegelt ein gesuchtes Sammlerstück.",
      en: "The chrome protocol droid of the Trade Federation was only available in 2012 as a May-the-4th promo polybag with a minimum purchase at LEGO Shop. Still the only TC-14 minifigure ever made - sealed bags are highly sought after.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000610.jpg",
  },
  // Quelle: BrickEconomy/minifigpriceguide; exklusiver Promo-Polybag 2011.
  {
    id: "sw0379",
    name: { de: "Shadow ARF Trooper", en: "Shadow ARF Trooper" },
    theme: "Star Wars",
    firstYear: 2011,
    appearsInSetIds: ["2856197"],
    rarity: "ultra-rare",
    valueNewEUR: 190,
    valueUsedEUR: 70,
    priceHistory: [
      { year: 2015, priceEUR: 60 },
      { year: 2019, priceEUR: 100 },
      { year: 2023, priceEUR: 150 },
      { year: 2026, priceEUR: 190 },
    ],
    description: {
      de: "Der komplett schwarze Klonkrieger existiert in keinem regulären Set: 2011 gab es ihn nur als Promo-Polybag bei Aktionen im LEGO Shop. Eine der beliebtesten Trooper-Varianten überhaupt und versiegelt dreistellig gehandelt.",
      en: "The all-black clone trooper never appeared in a regular set: in 2011 it was only available as a promo polybag during LEGO Shop campaigns. One of the most popular trooper variants ever, trading in three figures when sealed.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000305.jpg",
  },
  // Quelle: BrickEconomy; May-the-4th-Promo 2014, Fanwahl-Charakter aus KOTOR.
  {
    id: "sw0547",
    name: { de: "Darth Revan", en: "Darth Revan" },
    theme: "Star Wars",
    firstYear: 2014,
    appearsInSetIds: ["5002123"],
    rarity: "ultra-rare",
    valueNewEUR: 140,
    valueUsedEUR: 55,
    priceHistory: [
      { year: 2016, priceEUR: 35 },
      { year: 2020, priceEUR: 70 },
      { year: 2023, priceEUR: 110 },
      { year: 2026, priceEUR: 140 },
    ],
    description: {
      de: "Der Sith-Lord aus Knights of the Old Republic wurde von den Fans in einer Abstimmung zur Minifigur gewählt und 2014 nur als May-the-4th-Polybag verteilt. Bis heute sein einziger LEGO-Auftritt.",
      en: "The Sith Lord from Knights of the Old Republic was voted into minifigure form by fans and distributed only as a May-the-4th polybag in 2014. To this day his only LEGO appearance.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-001162.jpg",
  },
  // Quelle: minifigpriceguide/BrickEconomy; exklusiv in Cloud City 10123 wie
  // der Boba Fett (sw0107) und Lando (sw0105) aus demselben Set.
  {
    id: "sw0103",
    name: { de: "Luke Skywalker (Cloud City)", en: "Luke Skywalker (Cloud City)" },
    theme: "Star Wars",
    firstYear: 2003,
    appearsInSetIds: ["10123"],
    rarity: "ultra-rare",
    valueNewEUR: 280,
    valueUsedEUR: 120,
    priceHistory: [
      { year: 2014, priceEUR: 70 },
      { year: 2019, priceEUR: 140 },
      { year: 2022, priceEUR: 210 },
      { year: 2026, priceEUR: 280 },
    ],
    description: {
      de: "Bespin-Luke mit Blaster-Ziehhand und Tan-Hemd, exklusiv im kleinauflagigen Cloud-City-Set 10123 von 2003. Wie alle Figuren des Sets von dessen Legendenstatus getragen - nur der Boba Fett daneben ist noch teurer.",
      en: "Bespin Luke with tan shirt, exclusive to the small-run 2003 Cloud City set 10123. Like all figures from that set he rides its legendary status - only the Boba Fett next to him is pricier.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-003911.jpg",
  },
  // Quelle: BrickEconomy; erste Jango-Fett-Figur, lange exklusiv in 7153.
  {
    id: "sw0053",
    name: { de: "Jango Fett", en: "Jango Fett" },
    theme: "Star Wars",
    firstYear: 2002,
    appearsInSetIds: ["7153"],
    rarity: "ultra-rare",
    valueNewEUR: 220,
    valueUsedEUR: 90,
    priceHistory: [
      { year: 2014, priceEUR: 60 },
      { year: 2019, priceEUR: 110 },
      { year: 2022, priceEUR: 170 },
      { year: 2026, priceEUR: 220 },
    ],
    description: {
      de: "Der erste Jango Fett erschien 2002 ausschließlich in Jango Fett's Slave I (7153) und blieb über ein Jahrzehnt die einzige Figur des Kopfgeldjägers. Das teure Set wurde selten gekauft - entsprechend knapp ist die Figur heute.",
      en: "The first Jango Fett appeared in 2002 exclusively in Jango Fett's Slave I (7153) and remained the bounty hunter's only figure for over a decade. The expensive set sold in small numbers - making the figure scarce today.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-003646.jpg",
  },
  // Quelle: BrickEconomy; Light-Up-Vader aus 7263, als gravierte Toy-Fair-
  // Edition (Nuernberg 2005) eines der teuersten Vader-Sammlerstücke.
  {
    id: "toyfair2005",
    name: { de: "Darth Vader (Light-Up-Lichtschwert)", en: "Darth Vader (Light-Up Lightsaber)" },
    theme: "Star Wars",
    firstYear: 2005,
    appearsInSetIds: ["7263", "TOYFAIR2005"],
    rarity: "ultra-rare",
    valueNewEUR: 300,
    valueUsedEUR: 120,
    priceHistory: [
      { year: 2014, priceEUR: 90 },
      { year: 2019, priceEUR: 150 },
      { year: 2022, priceEUR: 220 },
      { year: 2026, priceEUR: 300 },
    ],
    description: {
      de: "Vader mit eingebauter LED: Drückt man den Kopf, leuchtet das Lichtschwert - ein Gimmick, das LEGO nur 2005 wagte. Funktionierende Exemplare werden knapp; die gravierte Sonderedition der Nürnberger Spielwarenmesse 2005 erzielt vierstellige Preise.",
      en: "Vader with a built-in LED: press the head and the lightsaber lights up - a gimmick LEGO only dared in 2005. Working examples are getting scarce; the engraved special edition from the 2005 Nuremberg Toy Fair fetches four-figure prices.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-003660.jpg",
  },
  // Quelle: brickranker/BrickEconomy; SDCC 2012, ca. 1.000 Stück.
  {
    id: "comcon024",
    name: { de: "Luke Skywalker (SDCC Landspeeder)", en: "Luke Skywalker (SDCC Landspeeder)" },
    theme: "Star Wars",
    firstYear: 2012,
    appearsInSetIds: ["COMCON024"],
    rarity: "ultra-rare",
    valueNewEUR: 520,
    valueUsedEUR: 260,
    priceHistory: [
      { year: 2015, priceEUR: 180 },
      { year: 2019, priceEUR: 300 },
      { year: 2023, priceEUR: 420 },
      { year: 2026, priceEUR: 520 },
    ],
    description: {
      de: "Tatooine-Luke im weißen Gewand, verteilt auf der San Diego Comic-Con 2012 zusammen mit einem Mini-Landspeeder. Die Figur erschien nie in einem regulären Set und gehört zu den seltensten Luke-Varianten überhaupt.",
      en: "Tatooine Luke in white robes, handed out at San Diego Comic-Con 2012 together with a mini landspeeder. The figure never appeared in a regular set and is one of the rarest Luke variants of all.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-001384.jpg",
  },
  // Quelle: BrickEconomy; Star Wars Celebration VI (2012), exklusiver Boba
  // mit Sturmhauben-Kopf im Mini-Slave-I-Beutel.
  {
    id: "celebvi",
    name: { de: "Boba Fett (Celebration VI)", en: "Boba Fett (Celebration VI)" },
    theme: "Star Wars",
    firstYear: 2012,
    appearsInSetIds: ["CELEBVI"],
    rarity: "ultra-rare",
    valueNewEUR: 360,
    valueUsedEUR: 180,
    priceHistory: [
      { year: 2015, priceEUR: 120 },
      { year: 2019, priceEUR: 200 },
      { year: 2023, priceEUR: 290 },
      { year: 2026, priceEUR: 360 },
    ],
    description: {
      de: "Auf der Star Wars Celebration VI 2012 gab es diesen Boba Fett mit exklusivem Sturmhauben-Kopf nur zusammen mit einer Mini-Slave-I. Kleine Auflage, nie regulär erhältlich - ein Pflichtstück für Fett-Komplettisten.",
      en: "At Star Wars Celebration VI in 2012 this Boba Fett with an exclusive balaclava head came only with a mini Slave I. Tiny print run, never sold at retail - a must-have for Fett completionists.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-001228.jpg",
  },

  // ── Comic-Con- & Toy-Fair-Exclusives (Marvel/DC/mehr) ────────────────────
  // Quelle: brickfanatics ("mind. 11.000 USD auf BrickLink"), brickranker
  // (5.000 USD): teuerste SDCC-Figur überhaupt, Design aus Amazing Spider-Man 2.
  {
    id: "comcon028",
    name: { de: "Spider-Man (SDCC 2013)", en: "Spider-Man (SDCC 2013)" },
    theme: "Marvel Super Heroes",
    firstYear: 2013,
    appearsInSetIds: ["COMCON028"],
    rarity: "ultra-rare",
    valueNewEUR: 6500,
    valueUsedEUR: 3500,
    priceHistory: [
      { year: 2015, priceEUR: 900 },
      { year: 2019, priceEUR: 2400 },
      { year: 2023, priceEUR: 4800 },
      { year: 2026, priceEUR: 6500 },
    ],
    description: {
      de: "Die teuerste Comic-Con-Figur aller Zeiten: Der Spider-Man im Amazing-Spider-Man-2-Design wurde 2013 in San Diego nur per Verlosung vergeben. Auf BrickLink starten Angebote im hohen vierstelligen Bereich - Karten-versiegelte Exemplare sind praktisch unbezahlbar.",
      en: "The most expensive Comic-Con figure of all time: the Spider-Man in Amazing Spider-Man 2 design was raffled off at San Diego in 2013. BrickLink listings start in the high four figures - carded sealed examples are practically priceless.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon028-1.jpg",
  },
  // Quelle: brickfanatics (ab ca. 5.900 GBP), brickranker; nur 350 Stück,
  // bis heute die einzige Spider-Woman-Minifigur.
  {
    id: "comcon027",
    name: { de: "Spider-Woman (SDCC 2013)", en: "Spider-Woman (SDCC 2013)" },
    theme: "Marvel Super Heroes",
    firstYear: 2013,
    appearsInSetIds: ["COMCON027"],
    rarity: "ultra-rare",
    valueNewEUR: 3800,
    valueUsedEUR: 2200,
    priceHistory: [
      { year: 2015, priceEUR: 700 },
      { year: 2019, priceEUR: 1800 },
      { year: 2023, priceEUR: 2900 },
      { year: 2026, priceEUR: 3800 },
    ],
    description: {
      de: "Nur 350 Exemplare wurden 2013 auf der San Diego Comic-Con verlost - und es blieb bis heute die einzige Spider-Woman-Minifigur überhaupt. Diese Kombination aus Mini-Auflage und Charakter-Exklusivität macht sie zur zweitteuersten SDCC-Figur.",
      en: "Only 350 examples were raffled at San Diego Comic-Con 2013 - and it remains the only Spider-Woman minifigure ever made. That combination of tiny print run and character exclusivity makes her the second most expensive SDCC figure.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon027-1.jpg",
  },
  // Quelle: brickranker (4.375 USD); nur 200 Stück, SDCC 2013.
  {
    id: "comcon030",
    name: { de: "Green Arrow (SDCC 2013)", en: "Green Arrow (SDCC 2013)" },
    theme: "DC Super Heroes",
    firstYear: 2013,
    appearsInSetIds: ["COMCON030"],
    rarity: "ultra-rare",
    valueNewEUR: 3400,
    valueUsedEUR: 1900,
    priceHistory: [
      { year: 2015, priceEUR: 500 },
      { year: 2019, priceEUR: 1500 },
      { year: 2023, priceEUR: 2600 },
      { year: 2026, priceEUR: 3400 },
    ],
    description: {
      de: "Der Bogenschütze mit dunkelgrüner Kapuze wurde 2013 in San Diego in einer Auflage von nur 200 Stück verlost. Zwar erschien 2014 eine reguläre Green-Arrow-Variante im Batman-Set 76028 - die SDCC-Version mit Kapuze blieb einzigartig.",
      en: "The archer with the dark green hood was raffled at San Diego 2013 in a run of just 200 pieces. A regular Green Arrow variant followed in 2014, but the hooded SDCC version remained unique.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon030-1.jpg",
  },
  // Quelle: brickranker (2.375 USD), Brick Fanatics (bis 3.500 USD);
  // 200 Stück, SDCC 2013.
  {
    id: "comcon029",
    name: { de: "Superman (Schwarzer Anzug, SDCC 2013)", en: "Superman (Black Suit, SDCC 2013)" },
    theme: "DC Super Heroes",
    firstYear: 2013,
    appearsInSetIds: ["COMCON029"],
    rarity: "ultra-rare",
    valueNewEUR: 2400,
    valueUsedEUR: 1300,
    priceHistory: [
      { year: 2015, priceEUR: 450 },
      { year: 2019, priceEUR: 1100 },
      { year: 2023, priceEUR: 1900 },
      { year: 2026, priceEUR: 2400 },
    ],
    description: {
      de: "Superman im schwarzen Regenerationsanzug aus der \"Death of Superman\"-Ära - 2013 in San Diego auf 200 Stück limitiert. Auf BrickLink wurden bereits 3.500 US-Dollar für ein Exemplar erzielt.",
      en: "Superman in the black regeneration suit from the \"Death of Superman\" era - limited to 200 pieces at San Diego 2013. Single examples have already fetched 3,500 US dollars on BrickLink.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-005618.jpg",
  },
  // Quelle: brickfanatics (guenstigstes Angebot ca. 1.350 EUR), brickranker.
  {
    id: "comcon023",
    name: { de: "Spider-Man (Symbiont-Anzug, SDCC 2012)", en: "Spider-Man (Black Symbiote Suit, SDCC 2012)" },
    theme: "Marvel Super Heroes",
    firstYear: 2012,
    appearsInSetIds: ["COMCON023"],
    rarity: "ultra-rare",
    valueNewEUR: 1200,
    valueUsedEUR: 600,
    priceHistory: [
      { year: 2015, priceEUR: 300 },
      { year: 2019, priceEUR: 600 },
      { year: 2023, priceEUR: 950 },
      { year: 2026, priceEUR: 1200 },
    ],
    description: {
      de: "Spider-Man im schwarzen Venom-Symbiontenanzug, verteilt auf der San Diego Comic-Con 2012. Der schwarze Anzug erschien nie in einem regulären Set dieser Ära - nur eine Handvoll Exemplare steht überhaupt zum Verkauf.",
      en: "Spider-Man in the black Venom symbiote suit, handed out at San Diego Comic-Con 2012. The black suit never appeared in a regular set of that era - only a handful of examples are ever for sale.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon023-1.jpg",
  },
  // Quelle: brickfanatics (einzige Jean-Grey-Figur, komplett exklusiv),
  // brickranker (456 USD lose).
  {
    id: "comcon021",
    name: { de: "Phoenix (Jean Grey, SDCC 2012)", en: "Phoenix (Jean Grey, SDCC 2012)" },
    theme: "Marvel Super Heroes",
    firstYear: 2012,
    appearsInSetIds: ["COMCON021"],
    rarity: "ultra-rare",
    valueNewEUR: 900,
    valueUsedEUR: 450,
    priceHistory: [
      { year: 2015, priceEUR: 300 },
      { year: 2019, priceEUR: 550 },
      { year: 2023, priceEUR: 750 },
      { year: 2026, priceEUR: 900 },
    ],
    description: {
      de: "Jean Grey im Phoenix-Kostüm ist bis heute die einzige LEGO-Figur der X-Men-Ikone - Torso, Beine und Doppelgesicht sind komplett SDCC-exklusiv. Verteilt 2012 in San Diego, seither ein Dauergast auf Grail-Listen.",
      en: "Jean Grey in her Phoenix costume is still the only LEGO figure of the X-Men icon - torso, legs and double-sided head are fully SDCC-exclusive. Handed out at San Diego 2012, a permanent fixture on grail lists ever since.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon021-1.jpg",
  },
  // Quelle: brickranker (394 USD lose, versiegelt deutlich hoeher); SDCC 2012.
  {
    id: "comcon020",
    name: { de: "Shazam (SDCC 2012)", en: "Shazam (SDCC 2012)" },
    theme: "DC Super Heroes",
    firstYear: 2012,
    appearsInSetIds: ["COMCON020"],
    rarity: "ultra-rare",
    valueNewEUR: 550,
    valueUsedEUR: 300,
    priceHistory: [
      { year: 2015, priceEUR: 180 },
      { year: 2019, priceEUR: 320 },
      { year: 2023, priceEUR: 450 },
      { year: 2026, priceEUR: 550 },
    ],
    description: {
      de: "Der erste LEGO-Shazam erschien 2012 exklusiv auf der San Diego Comic-Con - erst 2019 folgte mit den Film-Sets eine reguläre Version. Die Comic-Version mit klassischem Blitz-Torso blieb den Messebesuchern vorbehalten.",
      en: "The first LEGO Shazam appeared exclusively at San Diego Comic-Con 2012 - a regular version only followed with the 2019 movie sets. The comic version with the classic lightning torso remained convention-only.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-005621.jpg",
  },
  // Quelle: brickranker (331 USD lose); SDCC 2012, Spiegel-Logo "Nr. 1".
  {
    id: "comcon022",
    name: { de: "Bizarro (SDCC 2012)", en: "Bizarro (SDCC 2012)" },
    theme: "DC Super Heroes",
    firstYear: 2012,
    appearsInSetIds: ["COMCON022"],
    rarity: "ultra-rare",
    valueNewEUR: 450,
    valueUsedEUR: 240,
    priceHistory: [
      { year: 2015, priceEUR: 150 },
      { year: 2019, priceEUR: 260 },
      { year: 2023, priceEUR: 370 },
      { year: 2026, priceEUR: 450 },
    ],
    description: {
      de: "Supermans fehlerhafter Doppelgänger mit kalkweißem Gesicht und spiegelverkehrtem Logo wurde 2012 in San Diego verteilt und nie regulär aufgelegt. Als schräger Comic-Deep-Cut ein Liebling der Sammler.",
      en: "Superman's flawed doppelganger with chalk-white face and mirrored logo was handed out at San Diego 2012 and never released at retail. A quirky comic deep cut beloved by collectors.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon022-1.jpg",
  },
  // Quelle: minifigpriceguide (617 USD), brickranker; erste Comic-Con-
  // Minifigur-Exclusives ueberhaupt (SDCC + NYCC 2011).
  {
    id: "comcon014",
    name: { de: "Batman (Schwarzer Anzug, SDCC 2011)", en: "Batman (Black Suit, SDCC 2011)" },
    theme: "DC Super Heroes",
    firstYear: 2011,
    appearsInSetIds: ["COMCON014", "COMCON018"],
    rarity: "ultra-rare",
    valueNewEUR: 680,
    valueUsedEUR: 380,
    priceHistory: [
      { year: 2015, priceEUR: 250 },
      { year: 2019, priceEUR: 400 },
      { year: 2023, priceEUR: 560 },
      { year: 2026, priceEUR: 680 },
    ],
    description: {
      de: "Mit diesem schwarzen Batman (und dem Green Lantern) startete LEGO 2011 die Tradition der Comic-Con-Exclusives - noch vor dem Verkaufsstart der Super-Heroes-Reihe. Auf Blisterkarte einer der historisch wichtigsten Promos.",
      en: "With this black-suit Batman (and the Green Lantern) LEGO started the Comic-Con exclusives tradition in 2011 - before the Super Heroes line even hit shelves. On its blister card one of the most historically important promos.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-005622.jpg",
  },
  // Quelle: minifigpriceguide (333 USD), brickranker (388 USD); SDCC/NYCC 2011.
  {
    id: "comcon013",
    name: { de: "Green Lantern (SDCC 2011)", en: "Green Lantern (SDCC 2011)" },
    theme: "DC Super Heroes",
    firstYear: 2011,
    appearsInSetIds: ["COMCON013", "COMCON016"],
    rarity: "ultra-rare",
    valueNewEUR: 600,
    valueUsedEUR: 320,
    priceHistory: [
      { year: 2015, priceEUR: 220 },
      { year: 2019, priceEUR: 350 },
      { year: 2023, priceEUR: 490 },
      { year: 2026, priceEUR: 600 },
    ],
    description: {
      de: "Hal Jordan als Green Lantern war 2011 neben Batman die allererste Comic-Con-Minifigur von LEGO, verteilt in San Diego und New York. Die spätere Kaufhaus-Version von 2012 unterscheidet sich im Druck - das Original bleibt das Sammlerstück.",
      en: "Hal Jordan as Green Lantern was, alongside Batman, LEGO's very first Comic-Con minifigure in 2011, handed out in San Diego and New York. The later 2012 retail version differs in printing - the original remains the collectible.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-000975.jpg",
  },
  // Quelle: brickranker (500 USD); SDCC 2014, Guardians-of-the-Galaxy-Promo.
  {
    id: "comcon035",
    name: { de: "The Collector (SDCC 2014)", en: "The Collector (SDCC 2014)" },
    theme: "Marvel Super Heroes",
    firstYear: 2014,
    appearsInSetIds: ["COMCON035"],
    rarity: "ultra-rare",
    valueNewEUR: 550,
    valueUsedEUR: 300,
    priceHistory: [
      { year: 2016, priceEUR: 200 },
      { year: 2020, priceEUR: 330 },
      { year: 2023, priceEUR: 460 },
      { year: 2026, priceEUR: 550 },
    ],
    description: {
      de: "Taneleer Tivan, der Sammler aus Guardians of the Galaxy, erschien passenderweise nur als streng limitierte Messe-Figur auf der SDCC 2014. Eine Figur über das Sammeln, die man kaum bekommen kann - Meta-Grail.",
      en: "Taneleer Tivan, the Collector from Guardians of the Galaxy, fittingly appeared only as a strictly limited convention figure at SDCC 2014. A figure about collecting that is nearly impossible to collect - a meta grail.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon035-1.jpg",
  },
  // Quelle: brickranker (656 USD); SDCC 2014, Grant-Morrison-Batman.
  {
    id: "comcon036",
    name: { de: "Batman of Zur-En-Arrh (SDCC 2014)", en: "Batman of Zur-En-Arrh (SDCC 2014)" },
    theme: "DC Super Heroes",
    firstYear: 2014,
    appearsInSetIds: ["COMCON036"],
    rarity: "ultra-rare",
    valueNewEUR: 700,
    valueUsedEUR: 380,
    priceHistory: [
      { year: 2016, priceEUR: 260 },
      { year: 2020, priceEUR: 420 },
      { year: 2023, priceEUR: 580 },
      { year: 2026, priceEUR: 700 },
    ],
    description: {
      de: "Die knallbunte Notfall-Persönlichkeit Batmans aus Grant Morrisons \"Batman R.I.P.\" wurde 2014 in San Diego verlost. Lila, Rot und Gelb statt Grau - eine der auffälligsten Batman-Varianten und nie regulär erschienen.",
      en: "Batman's garish backup personality from Grant Morrison's \"Batman R.I.P.\" was raffled at San Diego 2014. Purple, red and yellow instead of grey - one of the most striking Batman variants, never released at retail.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon036-1.jpg",
  },
  // Quelle: brickranker (344 USD, oft um 500 USD gehandelt); SDCC 2017.
  {
    id: "comcon053",
    name: { de: "Deadpool Duck (SDCC 2017)", en: "Deadpool Duck (SDCC 2017)" },
    theme: "Marvel Super Heroes",
    firstYear: 2017,
    appearsInSetIds: ["COMCON053"],
    rarity: "ultra-rare",
    valueNewEUR: 480,
    valueUsedEUR: 260,
    priceHistory: [
      { year: 2018, priceEUR: 220 },
      { year: 2021, priceEUR: 320 },
      { year: 2024, priceEUR: 420 },
      { year: 2026, priceEUR: 480 },
    ],
    description: {
      de: "Das absurde Comic-Mashup aus Deadpool und Howard the Duck gab es 2017 nur per SDCC-Verlosung. Da LEGO seit Jahren keine neuen Deadpool-Figuren mehr auflegt, steigen alle Varianten des Söldners kontinuierlich im Wert.",
      en: "The absurd comic mashup of Deadpool and Howard the Duck was raffle-only at SDCC 2017. Since LEGO has not released new Deadpool figures in years, every variant of the merc keeps climbing in value.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon053-1.jpg",
  },
  // Quelle: brickranker (1.000 USD); SDCC 2018, letzte Deadpool-Figur.
  {
    id: "sdcc2018-1",
    name: { de: "Sheriff Deadpool (SDCC 2018)", en: "Sheriff Deadpool (SDCC 2018)" },
    theme: "Marvel Super Heroes",
    firstYear: 2018,
    appearsInSetIds: ["SDCC2018-1"],
    rarity: "ultra-rare",
    valueNewEUR: 950,
    valueUsedEUR: 520,
    priceHistory: [
      { year: 2019, priceEUR: 350 },
      { year: 2022, priceEUR: 600 },
      { year: 2024, priceEUR: 800 },
      { year: 2026, priceEUR: 950 },
    ],
    description: {
      de: "Deadpool mit Cowboyhut und Sheriffstern, verlost auf der SDCC 2018 - bis heute die letzte Deadpool-Minifigur, die LEGO produziert hat. Der ungewollte Serien-Abschluss macht sie zur teuersten Figur der SDCC-Jahrgänge 2015 bis 2019.",
      en: "Deadpool with cowboy hat and sheriff star, raffled at SDCC 2018 - to this day the last Deadpool minifigure LEGO has produced. That involuntary series finale makes it the most expensive figure of the 2015-2019 SDCC years.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/sdcc2018-1.jpg",
  },
  // Quelle: brickranker (525 USD, Tendenz steigend); SDCC 2019,
  // Design aus Detective Comics #275 (1960).
  {
    id: "sdcc2019-2",
    name: { de: "Zebra Batman (SDCC 2019)", en: "Zebra Batman (SDCC 2019)" },
    theme: "DC Super Heroes",
    firstYear: 2019,
    appearsInSetIds: ["SDCC2019-2"],
    rarity: "ultra-rare",
    valueNewEUR: 780,
    valueUsedEUR: 420,
    priceHistory: [
      { year: 2020, priceEUR: 300 },
      { year: 2022, priceEUR: 480 },
      { year: 2024, priceEUR: 640 },
      { year: 2026, priceEUR: 780 },
    ],
    description: {
      de: "Zum 80. Batman-Geburtstag griff LEGO 2019 den bizarren \"Zebra Batman\" aus Detective Comics #275 von 1960 auf - komplett in Schwarz-Weiß-Streifen. Als letzte klassische SDCC-Verlosungsfigur vor der Pandemie ein gesuchtes Stück.",
      en: "For Batman's 80th birthday LEGO revived the bizarre \"Zebra Batman\" from 1960's Detective Comics #275 - entirely in black-and-white stripes. As the last classic SDCC raffle figure before the pandemic, a sought-after piece.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/sdcc2019-2.jpg",
  },
  // Quelle: brickranker (594 USD); SDCC 2019, Design aus dem PS4-Spiel.
  {
    id: "sdcc2019-1",
    name: { de: "Spider-Man (PS4, SDCC 2019)", en: "Spider-Man (PS4, SDCC 2019)" },
    theme: "Marvel Super Heroes",
    firstYear: 2019,
    appearsInSetIds: ["SDCC2019-1"],
    rarity: "ultra-rare",
    valueNewEUR: 620,
    valueUsedEUR: 340,
    priceHistory: [
      { year: 2020, priceEUR: 250 },
      { year: 2022, priceEUR: 400 },
      { year: 2024, priceEUR: 520 },
      { year: 2026, priceEUR: 620 },
    ],
    description: {
      de: "Spider-Man im Advanced Suit aus dem PlayStation-Spiel von Insomniac, verlost auf der SDCC 2019. Das weiße Spinnenlogo unterscheidet ihn von allen regulären Varianten - ein Crossover aus Gaming- und LEGO-Sammlerwelt.",
      en: "Spider-Man in the Advanced Suit from Insomniac's PlayStation game, raffled at SDCC 2019. The white spider logo sets him apart from every retail variant - a crossover of gaming and LEGO collecting.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/sdcc2019-1.jpg",
  },
  // Quelle: brickranker (238 USD); SDCC 2019, Stranger-Things-Promo.
  {
    id: "sdcc2019-3",
    name: { de: "Barb (Stranger Things, SDCC 2019)", en: "Barb (Stranger Things, SDCC 2019)" },
    theme: "Stranger Things",
    firstYear: 2019,
    appearsInSetIds: ["SDCC2019-3"],
    rarity: "ultra-rare",
    valueNewEUR: 280,
    valueUsedEUR: 150,
    priceHistory: [
      { year: 2020, priceEUR: 120 },
      { year: 2022, priceEUR: 180 },
      { year: 2024, priceEUR: 230 },
      { year: 2026, priceEUR: 280 },
    ],
    description: {
      de: "Die Kultfigur Barb aus Stranger Things bekam nie einen Platz im großen Upside-Down-Set 75810 - dafür 2019 ihre eigene SDCC-Exclusive. \"Justice for Barb\" gilt bei LEGO-Sammlern eben doch.",
      en: "Cult favourite Barb from Stranger Things never made it into the big Upside Down set 75810 - instead she got her own SDCC exclusive in 2019. \"Justice for Barb\" does exist in LEGO collecting after all.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/sdcc2019-3.jpg",
  },
  // Quelle: brickranker (406 USD); SDCC 2016, 75 Jahre Captain America.
  {
    id: "sdcc2016-1",
    name: { de: "Steve Rogers Captain America (SDCC 2016)", en: "Steve Rogers Captain America (SDCC 2016)" },
    theme: "Marvel Super Heroes",
    firstYear: 2016,
    appearsInSetIds: ["SDCC2016-1"],
    rarity: "ultra-rare",
    valueNewEUR: 450,
    valueUsedEUR: 240,
    priceHistory: [
      { year: 2018, priceEUR: 180 },
      { year: 2021, priceEUR: 280 },
      { year: 2024, priceEUR: 380 },
      { year: 2026, priceEUR: 450 },
    ],
    description: {
      de: "Zum 75. Jubiläum des Captains erschien 2016 diese Comic-Version von Steve Rogers exklusiv in San Diego. Der Torso-Druck im klassischen Design blieb SDCC-Besuchern vorbehalten.",
      en: "For the Captain's 75th anniversary this comic version of Steve Rogers appeared exclusively at San Diego in 2016. The classic-design torso print remained convention-only.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/sdcc2016-1.jpg",
  },
  // Quelle: brickranker (375 USD); SDCC 2015, All-New Captain America.
  {
    id: "sdcc2015-4",
    name: { de: "Captain America (Sam Wilson, SDCC 2015)", en: "Captain America (Sam Wilson, SDCC 2015)" },
    theme: "Marvel Super Heroes",
    firstYear: 2015,
    appearsInSetIds: ["SDCC2015-4"],
    rarity: "ultra-rare",
    valueNewEUR: 420,
    valueUsedEUR: 220,
    priceHistory: [
      { year: 2017, priceEUR: 160 },
      { year: 2020, priceEUR: 260 },
      { year: 2023, priceEUR: 350 },
      { year: 2026, priceEUR: 420 },
    ],
    description: {
      de: "Sam Wilson als neuer Captain America aus der All-New-Comic-Reihe, verlost auf der SDCC 2015. Die einzige LEGO-Umsetzung von Wilsons Cap-Kostüm mit Falcon-Flügeln.",
      en: "Sam Wilson as the new Captain America from the All-New comic run, raffled at SDCC 2015. The only LEGO rendition of Wilson's Cap costume with Falcon wings.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/sdcc2015-4.jpg",
  },
  // Quelle: brickranker (269 USD); SDCC 2015, Arrow-TV-Serie.
  {
    id: "sdcc2015-5",
    name: { de: "Arsenal (SDCC 2015)", en: "Arsenal (SDCC 2015)" },
    theme: "DC Super Heroes",
    firstYear: 2015,
    appearsInSetIds: ["SDCC2015-5"],
    rarity: "ultra-rare",
    valueNewEUR: 300,
    valueUsedEUR: 160,
    priceHistory: [
      { year: 2017, priceEUR: 120 },
      { year: 2020, priceEUR: 190 },
      { year: 2023, priceEUR: 250 },
      { year: 2026, priceEUR: 300 },
    ],
    description: {
      de: "Roy Harper als Arsenal aus der TV-Serie Arrow - eine von LEGOs seltenen Figuren zu DC-Serienhelden, exklusiv auf der SDCC 2015 verteilt. Nie in einem Set erschienen.",
      en: "Roy Harper as Arsenal from the Arrow TV show - one of LEGO's rare figures based on DC television heroes, handed out exclusively at SDCC 2015. Never appeared in a set.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/sdcc2015-5.jpg",
  },
  // Quelle: brickranker (250 USD); SDCC 2016, Legends of Tomorrow.
  {
    id: "sdcc2016-2",
    name: { de: "ATOM (SDCC 2016)", en: "ATOM (SDCC 2016)" },
    theme: "DC Super Heroes",
    firstYear: 2016,
    appearsInSetIds: ["SDCC2016-2"],
    rarity: "ultra-rare",
    valueNewEUR: 280,
    valueUsedEUR: 150,
    priceHistory: [
      { year: 2018, priceEUR: 110 },
      { year: 2021, priceEUR: 180 },
      { year: 2024, priceEUR: 240 },
      { year: 2026, priceEUR: 280 },
    ],
    description: {
      de: "Ray Palmer im ATOM-Anzug aus DC's Legends of Tomorrow, exklusiv auf der SDCC 2016. Wie Arsenal ein TV-Held, den es nie in ein reguläres Set schaffte.",
      en: "Ray Palmer in his ATOM suit from DC's Legends of Tomorrow, exclusive to SDCC 2016. Like Arsenal a TV hero who never made it into a regular set.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/sdcc2016-2.jpg",
  },
  // Quelle: brickranker (206 USD); SDCC 2018, CW-Serie Black Lightning.
  {
    id: "sdcc2018-2",
    name: { de: "Black Lightning (SDCC 2018)", en: "Black Lightning (SDCC 2018)" },
    theme: "DC Super Heroes",
    firstYear: 2018,
    appearsInSetIds: ["SDCC2018-2"],
    rarity: "ultra-rare",
    valueNewEUR: 240,
    valueUsedEUR: 130,
    priceHistory: [
      { year: 2019, priceEUR: 100 },
      { year: 2022, priceEUR: 160 },
      { year: 2024, priceEUR: 210 },
      { year: 2026, priceEUR: 240 },
    ],
    description: {
      de: "Jefferson Pierce alias Black Lightning erschien 2018 als SDCC-Exclusive zur gleichnamigen CW-Serie. Die einzige LEGO-Figur des Helden - mit aufwendigem Blitz-Druck über Torso und Beine.",
      en: "Jefferson Pierce aka Black Lightning appeared in 2018 as an SDCC exclusive for the CW show of the same name. The hero's only LEGO figure - with an elaborate lightning print across torso and legs.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/sdcc2018-2.jpg",
  },
  // Quelle: brickranker (200 USD); SDCC 2017, CW-Seed-Animationsserie.
  {
    id: "comcon054",
    name: { de: "Vixen (SDCC 2017)", en: "Vixen (SDCC 2017)" },
    theme: "DC Super Heroes",
    firstYear: 2017,
    appearsInSetIds: ["COMCON054"],
    rarity: "ultra-rare",
    valueNewEUR: 260,
    valueUsedEUR: 140,
    priceHistory: [
      { year: 2018, priceEUR: 110 },
      { year: 2021, priceEUR: 170 },
      { year: 2024, priceEUR: 220 },
      { year: 2026, priceEUR: 260 },
    ],
    description: {
      de: "Mari McCabe alias Vixen aus der Animationsserie des Arrowverse, verteilt auf der SDCC 2017. Die einzige Vixen-Minifigur - und damit automatisch ein Grail für DC-Komplettisten.",
      en: "Mari McCabe aka Vixen from the Arrowverse animated series, handed out at SDCC 2017. The only Vixen minifigure ever - which automatically makes her a grail for DC completionists.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-002017.jpg",
  },
  // Quelle: brickranker (1.947 USD, Cap), BrickEconomy; New York Toy Fair
  // 2012, nur an Event-Gaeste verteilt, Auflage ca. 125 Stueck je Figur.
  {
    id: "toyfair2012-cap",
    name: { de: "Captain America (Toy Fair 2012)", en: "Captain America (Toy Fair 2012)" },
    theme: "Marvel Super Heroes",
    firstYear: 2012,
    appearsInSetIds: ["TOYFAIR2012"],
    rarity: "ultra-rare",
    valueNewEUR: 2000,
    valueUsedEUR: 1100,
    priceHistory: [
      { year: 2015, priceEUR: 500 },
      { year: 2019, priceEUR: 1000 },
      { year: 2023, priceEUR: 1600 },
      { year: 2026, priceEUR: 2000 },
    ],
    description: {
      de: "Zum Start der Super-Heroes-Reihe verschenkte LEGO auf der New Yorker Toy Fair 2012 ein Zwei-Figuren-Etui mit Captain America und Iron Man - Auflage nur gut hundert Stück. Eines der seltensten Marvel-Sammlerstücke überhaupt.",
      en: "To launch the Super Heroes line LEGO gave away a two-figure case with Captain America and Iron Man at the 2012 New York Toy Fair - a run of only about a hundred. One of the rarest Marvel collectibles in existence.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/toyfair2012-1.jpg",
  },
  // Quelle: brickranker/BrickEconomy; Gegenstueck zum Toy-Fair-Cap 2012.
  {
    id: "toyfair2012-im",
    name: { de: "Iron Man (Toy Fair 2012)", en: "Iron Man (Toy Fair 2012)" },
    theme: "Marvel Super Heroes",
    firstYear: 2012,
    appearsInSetIds: ["TOYFAIR2012"],
    rarity: "ultra-rare",
    valueNewEUR: 2000,
    valueUsedEUR: 1100,
    priceHistory: [
      { year: 2015, priceEUR: 500 },
      { year: 2019, priceEUR: 1000 },
      { year: 2023, priceEUR: 1600 },
      { year: 2026, priceEUR: 2000 },
    ],
    description: {
      de: "Der Toy-Fair-Iron-Man von 2012 teilt sich das Sammel-Etui mit dem Captain America - beide zusammen bildeten das Event-Geschenk zum Start der Super-Heroes-Reihe. Mit Mini-Auflage und Marvel-Strahlkraft ein absolutes Spitzenstück.",
      en: "The 2012 Toy Fair Iron Man shares its collector case with the Captain America - together they formed the event gift launching the Super Heroes line. Tiny print run plus Marvel star power make it an absolute top piece.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/toyfair2012-1.jpg",
  },

  // ── Weitere Convention- & Store-Exclusives ───────────────────────────────
  // Quelle: BrickEconomy; NYCC 2012, Start der TMNT-Lizenz.
  {
    id: "comcon025",
    name: { de: "Shadow Leonardo (NYCC 2012)", en: "Shadow Leonardo (NYCC 2012)" },
    theme: "Teenage Mutant Ninja Turtles",
    firstYear: 2012,
    appearsInSetIds: ["COMCON025"],
    rarity: "ultra-rare",
    valueNewEUR: 380,
    valueUsedEUR: 200,
    priceHistory: [
      { year: 2015, priceEUR: 140 },
      { year: 2019, priceEUR: 220 },
      { year: 2023, priceEUR: 320 },
      { year: 2026, priceEUR: 380 },
    ],
    description: {
      de: "Der komplett schwarze \"Shadow\" Leonardo wurde zur Ankündigung der Turtles-Lizenz auf der New York Comic-Con 2012 verteilt. Da die TMNT-Reihe schon 2014 wieder endete, blieb die Figur ein kurioses, extrem seltenes Kapitel LEGO-Geschichte.",
      en: "The all-black \"Shadow\" Leonardo was handed out at New York Comic-Con 2012 to announce the Turtles license. With the TMNT line ending as early as 2014, the figure remains a curious, extremely rare chapter of LEGO history.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon025-1.jpg",
  },
  // Quelle: BrickEconomy; NYCC 2012, exklusive Kraang-Variante.
  {
    id: "comcon026",
    name: { de: "Kraang (NYCC 2012)", en: "Kraang (NYCC 2012)" },
    theme: "Teenage Mutant Ninja Turtles",
    firstYear: 2012,
    appearsInSetIds: ["COMCON026"],
    rarity: "ultra-rare",
    valueNewEUR: 220,
    valueUsedEUR: 120,
    priceHistory: [
      { year: 2015, priceEUR: 90 },
      { year: 2019, priceEUR: 140 },
      { year: 2023, priceEUR: 190 },
      { year: 2026, priceEUR: 220 },
    ],
    description: {
      de: "Der Kraang-Droide im hellblauen Business-Anzug - mit dem Alien-Hirn, das aus dem zerrissenen Torso lugt - gab es nur auf der New York Comic-Con 2012, als LEGO die Turtles-Reihe vorstellte. Zusammen mit Shadow Leonardo eines von zwei TMNT-Messe-Exclusives.",
      en: "The Kraang droid in its light blue business suit - alien brain peeking through the torn torso - was only available at New York Comic-Con 2012 when LEGO unveiled the Turtles line. Together with Shadow Leonardo one of just two TMNT convention exclusives.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/comcon026-1.jpg",
  },
  // Quelle: BrickEconomy; Store-Eroeffnung Leicester Square 2016 (275 Stueck),
  // limitierte Neuauflage 40308 (2017).
  {
    id: "lester",
    name: { de: "Lester (Leicester Square)", en: "Lester (Leicester Square)" },
    theme: "Promotional",
    firstYear: 2016,
    appearsInSetIds: ["40308", "LESTER"],
    rarity: "ultra-rare",
    valueNewEUR: 420,
    valueUsedEUR: 250,
    priceHistory: [
      { year: 2018, priceEUR: 180 },
      { year: 2021, priceEUR: 280 },
      { year: 2024, priceEUR: 360 },
      { year: 2026, priceEUR: 420 },
    ],
    description: {
      de: "Lester, das Maskottchen des Londoner Flagship-Stores, wurde zur Eröffnung am Leicester Square 2016 in nur 275 Exemplaren verschenkt - 2017 folgte eine ebenfalls limitierte Blister-Auflage (40308). Die wohl berühmteste Store-Exklusivfigur.",
      en: "Lester, the mascot of the London flagship store, was given away in just 275 copies at the 2016 Leicester Square opening - followed in 2017 by an equally limited blister release (40308). Probably the most famous store-exclusive figure.",
    },
    imageUrl: "https://cdn.rebrickable.com/media/sets/fig-001723.jpg",
  },
];
