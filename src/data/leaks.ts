import type { LeakPost } from "./types";

// Leaks-, News- & Deals-Feed (Stand 5. Juli 2026), neueste zuerst.
// News/Leaks basieren auf recherchierten Meldungen (StoneWars, Brick Fanatics u. a.);
// Deals sind realistische Beispiel-Angebote und daher mit source "Demo" gekennzeichnet.
export const LEAKS: LeakPost[] = [
  {
    id: "news-insiders-days-2026",
    type: "news",
    title: {
      de: "LEGO Insiders Days ab 7. Juli: Doppelte Punkte & bis zu 40 % Rabatt",
      en: "LEGO Insiders Days from July 7: double points & up to 40% off",
    },
    body: {
      de: "Vom 7. bis 12. Juli 2026 laufen die Insiders Days: In Europa gibt es doppelte Insiders-Punkte sowie einen Sale im Onlineshop und in den Stores mit Rabatten von bis zu 40 Prozent. Wer EOL-Kandidaten wie den UCS-Falken auf der Liste hat, sollte diese Woche im Auge behalten.",
      en: "The Insiders Days run from July 7 to 12, 2026: Europe gets double Insiders points plus a sale in the online shop and stores with discounts of up to 40 percent. Anyone eyeing EOL candidates like the UCS Falcon should watch this week closely.",
    },
    source: "StoneWars",
    postedAt: "2026-07-04T15:30:00Z",
  },
  {
    id: "deal-10326-amazon",
    type: "deal",
    title: {
      de: "Naturhistorisches Museum (10326) für 214,99 € bei Amazon",
      en: "Natural History Museum (10326) for €214.99 at Amazon",
    },
    body: {
      de: "Beispiel-Deal: Das 4.014-Teile-Museum liegt rund 20 % unter UVP - bei einem Set, das laut EOL-Listen im Dezember 2026 ausläuft, doppelt interessant. Preis prüfen, Angebote dieser Art halten selten lange.",
      en: "Sample deal: the 4,014-piece museum sits about 20% below RRP - doubly interesting for a set slated to retire in December 2026. Check the price; offers like this rarely last.",
    },
    theme: "Icons",
    setId: "10326",
    source: "Demo",
    postedAt: "2026-07-03T09:15:00Z",
    dealPriceEUR: 214.99,
    dealRrpEUR: 269.99,
    dealShop: "Amazon",
  },
  {
    id: "news-july-2026-releases",
    type: "news",
    title: {
      de: "Juli-Neuheiten sind da: Koenigsegg Sadair's Spear, Flipperautomat & Lambda-Shuttle",
      en: "July releases are here: Koenigsegg Sadair's Spear, pinball machine & Lambda shuttle",
    },
    body: {
      de: "Seit dem 1. Juli sind die neuen Sets im Onlineshop: Highlight ist der Technic Koenigsegg Sadair's Spear (42232, 4.104 Teile, 449,99 €) mit exklusivem Lenkrad-GWP (40894). Dazu kommen der Icons-Flipperautomat im Classic-Space-Look (11374) und das Star-Wars-Set Imperial Lambda-Class Shuttle (75459).",
      en: "The new sets hit the online shop on July 1: the highlight is the Technic Koenigsegg Sadair's Spear (42232, 4,104 pieces, €449.99) with an exclusive steering-wheel GWP (40894). Also new: the Classic-Space-styled Icons pinball machine (11374) and the Star Wars Imperial Lambda-Class Shuttle (75459).",
    },
    theme: "Technic",
    setId: "42232",
    source: "StoneWars",
    postedAt: "2026-07-01T08:00:00Z",
  },
  {
    id: "leak-shrek-cmf",
    type: "leak",
    title: {
      de: "Shrek-Minifiguren-Serie kommt im September",
      en: "Shrek minifigure series arriving in September",
    },
    body: {
      de: "Im LEGO-Katalog fürs zweite Halbjahr 2026 ist eine Shrek-Sammelfiguren-Serie mit Release-Fenster September bestätigt. Welche Charaktere aus dem Sumpf es in die Tüten schaffen, ist noch offen - nach 72423 (Shrek, Esel & der Gestiefelte Kater) wächst das Shrek-Lineup damit weiter.",
      en: "The LEGO catalogue for H2 2026 confirms a Shrek collectible minifigure series with a September release window. Which swamp characters make it into the bags is still open - after 72423 (Shrek, Donkey & Puss) the Shrek lineup keeps growing.",
    },
    theme: "Collectible Minifigures",
    source: "StoneWars",
    postedAt: "2026-06-30T18:40:00Z",
    confidence: "confirmed",
  },
  {
    id: "deal-42151-alternate",
    type: "deal",
    title: {
      de: "Bugatti Bolide (42151) für 34,99 € bei Alternate",
      en: "Bugatti Bolide (42151) for €34.99 at Alternate",
    },
    body: {
      de: "Beispiel-Deal: 30 % unter UVP für den kompakten Technic-Bolide - und das Set steht für Juli 2026 auf den EOL-Listen. Klassischer Abverkaufspreis kurz vor dem Aus.",
      en: "Sample deal: 30% below RRP for the compact Technic Bolide - and the set is on the EOL lists for July 2026. A classic clearance price right before retirement.",
    },
    theme: "Technic",
    setId: "42151",
    source: "Demo",
    postedAt: "2026-06-30T07:50:00Z",
    dealPriceEUR: 34.99,
    dealRrpEUR: 49.99,
    dealShop: "Alternate",
  },
  {
    id: "news-retiring-soon-wave",
    type: "news",
    title: {
      de: "\"Nur noch kurze Zeit\": Über 100 Sets vor dem Aus im Juli",
      en: "\"Retiring Soon\": over 100 sets facing retirement in July",
    },
    body: {
      de: "LEGO hat im Onlineshop über 100 Sets mit dem Hinweis \"Nur noch kurze Zeit verfügbar\" markiert - offizieller Stichtag ist der 31. Juli 2026. Da die Produktion bereits gestoppt ist, gilt: solange der Vorrat reicht. Betroffen sind u. a. Ferrari Daytona SP3, die Große Halle und zahlreiche Star-Wars-Sets.",
      en: "LEGO has flagged over 100 sets as \"Retiring Soon\" in the online shop - the official cut-off is July 31, 2026. Since production has already stopped, it's while supplies last. Affected sets include the Ferrari Daytona SP3, the Great Hall and numerous Star Wars sets.",
    },
    source: "StoneWars",
    postedAt: "2026-06-29T12:20:00Z",
  },
  {
    id: "leak-buddy-the-elf",
    type: "leak",
    title: {
      de: "Gerücht: Set zu \"Buddy - Der Weihnachtself\" in Arbeit?",
      en: "Rumor: \"Elf\" Buddy the Elf set in the works?",
    },
    body: {
      de: "In der aktuellen Gerüchte-Sammelrunde taucht ein Set zum Weihnachtsfilm-Klassiker \"Elf\" mit Buddy auf. Teilezahl, Preis und Format sind völlig offen - bis zu offiziellen Bildern ist das als unbestätigtes Gerücht zu behandeln.",
      en: "The latest rumor roundup mentions a set based on the Christmas movie classic \"Elf\" featuring Buddy. Piece count, price and format are completely open - treat this as unconfirmed until official images appear.",
    },
    theme: "Icons",
    source: "StoneWars",
    postedAt: "2026-06-28T20:10:00Z",
    confidence: "rumor",
  },
  {
    id: "news-city-trains-summer",
    type: "news",
    title: {
      de: "City-Sommerwelle enthüllt: Dampflok, Hafenbahn und Strand-Straßenbahn",
      en: "City summer wave revealed: steam train, harbour railway and beach streetcar",
    },
    body: {
      de: "Ein Fest für Eisenbahn-Fans: Die Juni-Neuheiten bringen erstmals eine echte City-Dampflok, eine Hafenbahn mit Powered-Up-Option und eine Straßenbahn im Vintage-Look. Zusammen mit dem Polizeizug vom März ist 2026 das stärkste Zug-Jahr seit langem.",
      en: "A treat for train fans: the June releases include City's first proper steam locomotive, a harbour railway with a Powered Up option and a vintage-style streetcar. Together with March's police train, 2026 is the strongest train year in ages.",
    },
    theme: "City",
    source: "StoneWars",
    postedAt: "2026-06-27T10:00:00Z",
  },
  {
    id: "leak-sea-serpent-gwp",
    type: "leak",
    title: {
      de: "Retro-GWP im Anflug: Hommage an die Sea Serpent (6057)",
      en: "Retro GWP incoming: homage to the Sea Serpent (6057)",
    },
    body: {
      de: "Als nächstes Retro-Gratisset wird eine Neuinterpretation des Ritterboots Sea Serpent von 1985 erwartet - voraussichtlich ab 180 € Einkaufswert im Juli, Warenwert rund 24,99 €. Nach Galaxy Explorer & Co. setzt LEGO die beliebte Nostalgie-GWP-Reihe damit fort.",
      en: "The next retro gift-with-purchase is expected to be a reinterpretation of the 1985 Sea Serpent knights' boat - likely from €180 spend in July, valued around €24.99. After Galaxy Explorer & co., LEGO continues its popular nostalgia GWP series.",
    },
    theme: "Castle",
    source: "StoneWars",
    postedAt: "2026-06-26T17:45:00Z",
    confidence: "rumor",
  },
  {
    id: "deal-76437-smyths",
    type: "deal",
    title: {
      de: "Der Fuchsbau CE (76437) für 199,99 € bei Smyths Toys",
      en: "The Burrow CE (76437) for €199.99 at Smyths Toys",
    },
    body: {
      de: "Beispiel-Deal: 50 € unter UVP für die Collectors' Edition des Fuchsbaus - ein Set, das laut EOL-Listen Ende 2026 ausläuft. Die Gringotts-CE hat gezeigt, wie schnell solche Sets nach dem EOL anziehen.",
      en: "Sample deal: €50 below RRP for the Burrow Collectors' Edition - a set slated to retire at the end of 2026. The Gringotts CE showed how quickly such sets rise after EOL.",
    },
    theme: "Harry Potter",
    setId: "76437",
    source: "Demo",
    postedAt: "2026-06-26T08:30:00Z",
    dealPriceEUR: 199.99,
    dealRrpEUR: 249.99,
    dealShop: "Smyths Toys",
  },
  {
    id: "news-eol-midyear-list",
    type: "news",
    title: {
      de: "EOL-Halbjahresbilanz: Über 120 Sets gehen 2026 - Deku-Baum schon ausverkauft",
      en: "Mid-year EOL update: over 120 sets retiring in 2026 - Deku Tree already sold out",
    },
    body: {
      de: "Die aktualisierte EOL-Liste zählt zur Jahresmitte über 120 Auslaufmodelle, darunter 18 exklusive Sets - ungewöhnlich viele davon bereits zum 31. Juli. Der Mächtige Deku-Baum (77092) ist im Onlineshop schon jetzt restlos vergriffen. Einzelne Highlights wie Eiffelturm und Sternzerstörer (75394) wurden dafür bis Juli 2027 verlängert.",
      en: "The updated mid-year EOL list counts over 120 retiring sets, including 18 exclusives - an unusual number already leaving by July 31. The Great Deku Tree (77092) is completely sold out in the online shop. Some highlights like the Eiffel Tower and the Star Destroyer (75394) were extended to July 2027 instead.",
    },
    source: "StoneWars",
    postedAt: "2026-06-25T14:00:00Z",
  },
  {
    id: "deal-60423-amazon",
    type: "deal",
    title: {
      de: "Straßenbahn mit Haltestelle (60423) für 47,99 € bei Amazon",
      en: "Downtown Streetcar (60423) for €47.99 at Amazon",
    },
    body: {
      de: "Beispiel-Deal: Rund 26 % unter UVP für die City-Straßenbahn - ideal für jede LEGO-Stadt mit Nahverkehr. Das Set steht für Dezember 2026 auf den EOL-Listen, der Vintage-Nachfolger ist bereits enthüllt.",
      en: "Sample deal: about 26% below RRP for the City streetcar - ideal for any LEGO city with public transport. The set is on the EOL lists for December 2026, and its vintage-style successor has already been revealed.",
    },
    theme: "City",
    setId: "60423",
    source: "Demo",
    postedAt: "2026-06-25T07:20:00Z",
    dealPriceEUR: 47.99,
    dealRrpEUR: 64.99,
    dealShop: "Amazon",
  },
];
