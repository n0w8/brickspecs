#!/usr/bin/env node
/**
 * BrickSpecs: Deutsche Katalog-Setnamen (regelbasiert)
 *
 * Übersetzt die englischen Rebrickable-Setnamen konservativ ins Deutsche und
 * schreibt src/data/catalog/names-de.json ({ "60141-1": "Polizeistation", ... }).
 * Es werden NUR Sets geschrieben, deren Name sich tatsächlich ändert.
 *
 * Prinzip "ganz oder gar nicht": Ein Name wird nur übersetzt, wenn JEDES Wort
 * sauber klassifiziert werden kann (Wörterbuch-Phrase, Einzelwort, erlaubtes
 * unverändertes Wort, Zahl/Kennung oder Konnektor). Bleibt auch nur ein Wort
 * unklar, bleibt der komplette Name englisch - so entsteht kein Denglisch wie
 * "Polizei Station Chase". Zusätzlich verhindert eine Nachbarschaftsregel
 * zerhackte Komposita ("Burg Ritter"): zwei direkt nebeneinanderstehende
 * übersetzte Wörter ohne Konnektor führen zum Verwerfen der Übersetzung.
 *
 * Lizenzthemen (Star Wars, Marvel, Harry Potter, ...) werden komplett
 * übersprungen - LEGO lässt diese Produktnamen auch im deutschen Katalog
 * englisch. Ausnahme: die explizite Einzelset-Liste (z. B. "Todesstern").
 *
 * Aufruf:  node scripts/generate-names-de.mjs
 * Wird am Ende von scripts/sync-catalog.mjs automatisch mit ausgeführt.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_DIR = join(ROOT, "src", "data", "catalog");

/* ------------------------------------------------------------------ */
/* Lizenz-Root-Themes: Namen bleiben englisch (wie im LEGO-DE-Katalog) */
/* ------------------------------------------------------------------ */

const LICENSED_ROOT_THEMES = new Set([
  "Star Wars",
  "Super Heroes Marvel",
  "Super Heroes DC",
  "DC Super Hero Girls",
  "Harry Potter",
  "Disney",
  "Minecraft",
  "Jurassic World",
  "Ninjago",
  "Fortnite",
  "Sonic The Hedgehog",
  "Super Mario",
  "One Piece",
  "Wednesday",
  "Stranger Things",
  "Angry Birds",
  "Animal Crossing",
  "Avatar",
  "Avatar: The Last Airbender",
  "Ben 10",
  "Bluey",
  "Cars",
  "Despicable Me 4",
  "Dimensions",
  "Gabby's Dollhouse",
  "Ghostbusters",
  "Indiana Jones",
  "KPop Demon Hunters",
  "Minions",
  "Nike",
  "Overwatch",
  "Pokémon",
  "Scooby-Doo",
  "Shrek",
  "Speed Champions",
  "Speed Racer",
  "SpongeBob SquarePants",
  "Sports",
  "Teenage Mutant Ninja Turtles",
  "The Hobbit and Lord of the Rings",
  "The LEGO Movie",
  "The Legend of Zelda",
  "The Lone Ranger",
  "The Powerpuff Girls",
  "Trolls: World Tour",
  "Unikitty!",
  "Wicked",
]);

// Nicht-Bau-Themes wie in src/lib/catalog.ts - für sie braucht es keine Namen.
const NON_BUILDING_ROOT_THEMES = new Set(["Gear", "Books", "Service Packs", "Bulk Bricks"]);

/* ------------------------------------------------------------------ */
/* Einzelset-Liste: weltberühmte Eigennamen mit etablierter deutscher  */
/* Übersetzung - gilt auch innerhalb übersprungener Lizenzthemen.      */
/* ------------------------------------------------------------------ */

const SET_OVERRIDES = {
  "10188-1": "Todesstern",
  "75159-1": "Todesstern",
  "10143-1": "Todesstern II",
  "71043-1": "Schloss Hogwarts",
  "4842-1": "Schloss Hogwarts",
  "75954-1": "Die große Halle von Hogwarts",
};

/* ------------------------------------------------------------------ */
/* Wörterbuch                                                          */
/* ------------------------------------------------------------------ */

// Mehrwort-Phrasen (längste zuerst angewendet). Schlüssel kleingeschrieben,
// Wörter durch einzelne Leerzeichen getrennt; Bindestriche im Original
// ("Ice-Cream") werden beim Abgleich wie Leerzeichen behandelt.
const PHRASES = {
  // Stadt: Polizei & Feuerwehr
  "police station": "Polizeistation",
  "police headquarters": "Polizeihauptquartier",
  "police car": "Polizeiauto",
  "police helicopter": "Polizeihubschrauber",
  "police boat": "Polizeiboot",
  "police motorcycle": "Polizeimotorrad",
  "police truck": "Polizeitruck",
  "police patrol": "Polizeistreife",
  "police chase": "Polizei-Verfolgungsjagd",
  "police officer": "Polizist",
  "family car": "Familienauto",
  "power boat": "Rennboot",
  "halloween pumpkin": "Halloween-Kürbis",
  "prisoner transport van": "Gefangenentransporter",
  "prisoner transport": "Gefangenentransport",
  "fire station": "Feuerwache",
  "fire truck": "Löschfahrzeug",
  "fire engine": "Feuerwehrauto",
  "fire boat": "Feuerwehrboot",
  "fire helicopter": "Feuerwehrhubschrauber",
  "fire plane": "Löschflugzeug",
  "fire brigade": "Feuerwehr",
  "fire chief": "Feuerwehrhauptmann",
  "coast guard": "Küstenwache",
  "rescue helicopter": "Rettungshubschrauber",
  "ambulance helicopter": "Rettungshubschrauber",
  "rescue boat": "Rettungsboot",
  "rescue plane": "Rettungsflugzeug",

  // Eisenbahn
  "train station": "Bahnhof",
  "cargo train": "Güterzug",
  "freight train": "Güterzug",
  "passenger train": "Personenzug",
  "steam train": "Dampfzug",
  "steam engine": "Dampflokomotive",
  "train engine": "Lokomotive",
  "high speed train": "Hochgeschwindigkeitszug",
  "level crossing": "Bahnübergang",
  "straight rails": "Gerade Schienen",
  "curved rails": "Gebogene Schienen",

  // Fahrzeuge
  "race car": "Rennwagen",
  "racing car": "Rennwagen",
  "sports car": "Sportwagen",
  "rally car": "Rallyeauto",
  "tow truck": "Abschleppwagen",
  "dump truck": "Kipplaster",
  "garbage truck": "Müllabfuhr",
  "monster truck": "Monstertruck",
  "delivery truck": "Lieferwagen",
  "delivery van": "Lieferwagen",
  "ice cream truck": "Eiswagen",
  "ice cream van": "Eiswagen",
  "ice cream stand": "Eisstand",
  "cement mixer": "Betonmischer",
  "concrete mixer": "Betonmischer",
  "mobile crane": "Mobilkran",
  "tower crane": "Turmkran",
  "crawler crane": "Raupenkran",
  "crane truck": "Kranwagen",
  "front end loader": "Radlader",
  "backhoe loader": "Baggerlader",
  "wheel loader": "Radlader",
  "snow plow": "Schneepflug",
  "snow groomer": "Pistenraupe",
  "street sweeper": "Straßenkehrmaschine",
  "car wash": "Autowaschanlage",
  "car transporter": "Autotransporter",
  "car carrier": "Autotransporter",
  "gas station": "Tankstelle",
  "service station": "Tankstelle",
  "horse trailer": "Pferdeanhänger",
  "horse stable": "Pferdestall",
  "covered wagon": "Planwagen",
  "hot air balloon": "Heißluftballon",

  // Luft & Wasser
  "passenger plane": "Passagierflugzeug",
  "passenger jet": "Passagierjet",
  "cargo plane": "Frachtflugzeug",
  "space shuttle": "Raumfähre",
  "space station": "Raumstation",
  "moon base": "Mondbasis",
  "container ship": "Containerschiff",
  "cargo ship": "Frachtschiff",
  "fishing boat": "Fischerboot",
  "sailing ship": "Segelschiff",
  "sailing boat": "Segelboot",
  "tug boat": "Schlepper",
  "pirate ship": "Piratenschiff",
  "ghost ship": "Geisterschiff",
  "viking ship": "Wikingerschiff",

  // Gebäude & Orte
  "haunted house": "Geisterhaus",
  "tree house": "Baumhaus",
  "family house": "Familienhaus",
  "beach house": "Strandhaus",
  "town house": "Stadthaus",
  "town hall": "Rathaus",
  "town square": "Stadtplatz",
  "doll house": "Puppenhaus",
  "gingerbread house": "Lebkuchenhaus",
  "winter village": "Winterdorf",
  "post office": "Postamt",
  "grocery store": "Supermarkt",
  "toy store": "Spielzeugladen",
  "pet shop": "Zoohandlung",
  "book shop": "Buchhandlung",
  "corner garage": "Eckgarage",
  "pizza van": "Pizzawagen",
  "burger truck": "Burger-Truck",
  "construction site": "Baustelle",
  "amusement park": "Freizeitpark",
  "water park": "Wasserpark",
  "ferris wheel": "Riesenrad",
  "roller coaster": "Achterbahn",
  "living room": "Wohnzimmer",
  "vet clinic": "Tierklinik",
  "wind turbine": "Windkraftanlage",
  "king's castle": "Königsburg",
  "knight's castle": "Ritterburg",
  "court jester": "Hofnarr",
  "treasure island": "Schatzinsel",
  "treasure chest": "Schatztruhe",
  "deep sea": "Tiefsee",

  // Weltberühmte Bauwerke (Icons/Architecture, keine Lizenzthemen)
  "eiffel tower": "Eiffelturm",
  "statue of liberty": "Freiheitsstatue",
  "great wall of china": "Chinesische Mauer",

  // Saison & Anlässe
  "advent calendar": "Adventskalender",
  "christmas tree": "Weihnachtsbaum",
  "christmas wreath": "Weihnachtskranz",
  "santa claus": "Weihnachtsmann",
  "santa's sleigh": "Schlitten des Weihnachtsmanns",
  "easter bunny": "Osterhase",
  "easter egg": "Osterei",
  "easter chick": "Osterküken",
  "birthday party": "Geburtstagsparty",
  "birthday cake": "Geburtstagstorte",
  "flower bouquet": "Blumenstrauß",
  "wildflower bouquet": "Wildblumenstrauß",
  "bonsai tree": "Bonsai-Baum",
  "cherry blossoms": "Kirschblüten",
  "lotus flowers": "Lotusblumen",
  "tiny plants": "Mini-Pflanzen",

  // Sonstiges
  "wild animals": "Wilde Tiere",
  "farm animals": "Bauernhoftiere",
  "accessory set": "Zubehörset",
  "expansion set": "Erweiterungsset",
  "starter set": "Starterset",
  "gift set": "Geschenkset",
  "building set": "Bauset",
  "mini figures": "Minifiguren",
  "chess set": "Schachspiel",
};

// Einzelwörter, die alleinstehend sicher übersetzbar sind. Bewusst NICHT
// enthalten: Kompositum-Bildner wie "police", "fire", "rescue", "cargo"
// (nur über Phrasen), Farben und Adjektive (Deklination), "the"/"a".
const WORDS = {
  // Fahrzeuge & Verkehr
  helicopter: "Hubschrauber",
  ambulance: "Krankenwagen",
  airplane: "Flugzeug",
  plane: "Flugzeug",
  seaplane: "Wasserflugzeug",
  airport: "Flughafen",
  harbor: "Hafen",
  harbour: "Hafen",
  lighthouse: "Leuchtturm",
  ferry: "Fähre",
  submarine: "U-Boot",
  boat: "Boot",
  ship: "Schiff",
  shipwreck: "Schiffswrack",
  train: "Zug",
  locomotive: "Lokomotive",
  tram: "Straßenbahn",
  rails: "Schienen",
  car: "Auto",
  cars: "Autos",
  vehicle: "Fahrzeug",
  vehicles: "Fahrzeuge",
  motorcycle: "Motorrad",
  motorbike: "Motorrad",
  bicycle: "Fahrrad",
  tractor: "Traktor",
  excavator: "Bagger",
  digger: "Bagger",
  crane: "Kran",
  forklift: "Gabelstapler",
  snowplow: "Schneepflug",
  trailer: "Anhänger",
  fireboat: "Feuerwehrboot",
  firefighter: "Feuerwehrmann",
  policeman: "Polizist",
  spaceship: "Raumschiff",
  rocket: "Rakete",
  satellite: "Satellit",

  // Gebäude & Orte
  house: "Haus",
  farmhouse: "Bauernhaus",
  treehouse: "Baumhaus",
  dollhouse: "Puppenhaus",
  castle: "Burg",
  tower: "Turm",
  bridge: "Brücke",
  windmill: "Windmühle",
  watermill: "Wassermühle",
  mill: "Mühle",
  village: "Dorf",
  market: "Markt",
  bakery: "Bäckerei",
  library: "Bibliothek",
  school: "Schule",
  schoolbus: "Schulbus",
  hospital: "Krankenhaus",
  supermarket: "Supermarkt",
  farm: "Bauernhof",
  barn: "Scheune",
  stable: "Stall",
  playground: "Spielplatz",
  garden: "Garten",
  kitchen: "Küche",
  bathroom: "Badezimmer",
  bedroom: "Schlafzimmer",
  fountain: "Springbrunnen",
  colosseum: "Kolosseum",
  bookshop: "Buchhandlung",

  // Natur
  forest: "Wald",
  jungle: "Dschungel",
  desert: "Wüste",
  mountain: "Berg",
  volcano: "Vulkan",
  beach: "Strand",
  island: "Insel",
  ocean: "Ozean",
  sea: "Meer",
  tree: "Baum",
  trees: "Bäume",
  flower: "Blume",
  flowers: "Blumen",
  orchid: "Orchidee",
  succulents: "Sukkulenten",
  roses: "Rosen",
  tulips: "Tulpen",
  sunflowers: "Sonnenblumen",
  daffodils: "Narzissen",
  chrysanthemum: "Chrysantheme",
  pumpkin: "Kürbis",

  // Ritter, Piraten, Fantasy
  knight: "Ritter",
  knights: "Ritter",
  king: "König",
  queen: "Königin",
  princess: "Prinzessin",
  prince: "Prinz",
  wizard: "Zauberer",
  witch: "Hexe",
  dragon: "Drache",
  dragons: "Drachen",
  ghost: "Geist",
  skeleton: "Skelett",
  vampire: "Vampir",
  werewolf: "Werwolf",
  mummy: "Mumie",
  pirate: "Pirat",
  pirates: "Piraten",
  viking: "Wikinger",
  vikings: "Wikinger",
  treasure: "Schatz",
  unicorn: "Einhorn",
  mermaid: "Meerjungfrau",
  soldier: "Soldat",
  archer: "Bogenschütze",
  blacksmith: "Schmied",

  // Tiere
  dinosaur: "Dinosaurier",
  dinosaurs: "Dinosaurier",
  shark: "Hai",
  whale: "Wal",
  horse: "Pferd",
  horses: "Pferde",
  lion: "Löwe",
  bear: "Bär",
  monkey: "Affe",
  elephant: "Elefant",
  cat: "Katze",
  dog: "Hund",
  puppy: "Welpe",
  kitten: "Kätzchen",
  duck: "Ente",
  eagle: "Adler",
  parrot: "Papagei",
  turtle: "Schildkröte",
  crocodile: "Krokodil",
  snake: "Schlange",
  penguin: "Pinguin",
  owl: "Eule",
  fox: "Fuchs",
  rabbit: "Kaninchen",
  bunny: "Hase",
  butterfly: "Schmetterling",
  reindeer: "Rentier",
  animals: "Tiere",

  // Menschen & Berufe
  farmer: "Bauer",
  postman: "Briefträger",
  diver: "Taucher",
  chef: "Koch",
  doctor: "Arzt",

  // Saison
  christmas: "Weihnachten",
  snowman: "Schneemann",
  sleigh: "Schlitten",
  wedding: "Hochzeit",

  // Sonstiges
  minifigure: "Minifigur",
  minifigures: "Minifiguren",
  series: "Serie",
  cake: "Kuchen",
  chess: "Schach",
  tent: "Zelt",
  campfire: "Lagerfeuer",
  robot: "Roboter",
};

// Konnektoren: dürfen neben Übersetzungen stehen, ohne die
// Nachbarschaftsregel auszulösen.
const CONNECTORS = {
  and: "und",
  with: "mit",
  or: "oder",
  in: "in",
  for: "für",
};

// Marken- und Produktlinien-Namen: dürfen unverändert bleiben und dürfen
// direkt VOR einer Übersetzung stehen ("City Adventskalender",
// "Basic Bauset", "Heartlake City Bäckerei"). Kleingeschrieben.
const BRANDS = new Set([
  "lego", "duplo", "technic", "city", "friends", "creator", "classic",
  "bionicle", "icons", "ideas", "fabuland", "belville", "primo", "quatro",
  "juniors", "scala", "znap", "modulex", "dots", "xtra", "heartlake",
  "mindstorms", "boost", "legoland", "basic", "universal", "system",
  "expert",
]);

// Wörter, die unverändert bleiben dürfen (im Deutschen gängige Begriffe,
// Eigennamen). Anders als BRANDS dürfen sie NICHT direkt vor einer
// Übersetzung stehen (verhindert "Cool Autos", "Zoo Zug"). Kleingeschrieben.
const KEEP = new Set([
  // Lizenz-Markennamen, die in DE-Produktnamen stehen bleiben
  "star", "wars", "marvel", "batman", "disney",
  // Im Deutschen gängige englische/internationale Begriffe
  "set", "mini", "midi", "maxi", "micro", "team", "club", "park", "zoo",
  "taxi", "bus", "jet", "van", "truck", "pick", "up", "pickup", "camper",
  "bike", "quad", "atv", "kart", "gokart", "buggy", "tanker", "container",
  "hovercraft", "rover", "scooter", "trike", "motor", "turbo", "grand",
  "prix", "pizza", "pizzeria", "burger", "restaurant", "café", "cafe",
  "hotel", "kiosk", "museum", "bank", "garage", "marina", "camping",
  "safari", "arctic", "stunt", "show", "party", "baby", "pony",
  "elf", "clown", "pilot", "astronaut", "zombie", "troll",
  "panda", "tiger", "giraffe", "koala", "lama", "alpaka", "hamster",
  "halloween", "ninja", "samurai", "pharao", "sphinx", "gladiator",
  "mountainbike", "combo", "bundle", "pack", "super",
  "extra", "plus", "vip", "fan", "box", "cool", "surfer", "surf",
  "skateboard", "snowboard", "ski", "yacht", "kajak", "kayak", "kanu",
  "canoe", "jeep", "chevrolet", "ford", "ferrari", "porsche", "lamborghini",
  "bugatti", "mclaren", "audi", "bmw", "mercedes", "benz", "amg",
  "volkswagen", "vespa", "vestas", "maersk", "shell", "exxon", "octan",
  "edition", "vintage",
  "hot", "rod", "monster", "jack", "jr", "sr", "st", "dr",
  "tender", "loop", "power", "speed", "ev", "usa", "uk", "nasa",
  "tokyo", "paris", "london", "berlin", "york", "dubai", "singapore",
  "sydney", "amsterdam", "venice", "vegas", "las", "san", "francisco",
  "chicago", "shanghai", "titanic", "ben", "big",
]);

// Marken-Phrasen, die als Ganzes unverändert bleiben (z. B. im
// Adventskalender-Namen "Star Wars Advent Calendar").
const KEEP_PHRASES = [
  "star wars",
  "harry potter",
  "spider man",
  "tower bridge",
  "taj mahal",
  "big ben",
];

/* ------------------------------------------------------------------ */
/* Übersetzungslogik                                                   */
/* ------------------------------------------------------------------ */

const ROMAN = new Set(["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"]);

// Phrasen nach Wortanzahl absteigend sortiert (längste zuerst).
const PHRASE_LIST = [
  ...Object.entries(PHRASES).map(([k, v]) => ({ words: k.split(" "), value: v, keep: false })),
  ...KEEP_PHRASES.map((k) => ({ words: k.split(" "), value: null, keep: true })),
].sort((a, b) => b.words.length - a.words.length);

/** Zerlegt einen Namen in Wort-Tokens und Trenner (Reihenfolge erhalten). */
function tokenize(name) {
  const parts = [];
  const re = /[A-Za-z0-9À-ÿ'’]+/g;
  let last = 0;
  let m;
  while ((m = re.exec(name)) !== null) {
    if (m.index > last) parts.push({ sep: name.slice(last, m.index) });
    parts.push({ word: m[0] });
    last = m.index + m[0].length;
  }
  if (last < name.length) parts.push({ sep: name.slice(last) });
  return parts;
}

const isWs = (s) => /^\s+$/.test(s);
// Trenner, über die Phrasen hinweg matchen dürfen: Leerzeichen oder Bindestrich
const isPhraseSep = (s) => /^[\s-]+$/.test(s);

function normWord(w) {
  return w.toLowerCase().replace(/’/g, "'");
}

/** Übersetzt einen Namen oder liefert null (konservativ: lieber gar nicht). */
function translateName(name) {
  const parts = tokenize(name);
  const segments = []; // { text, kind: 'phrase'|'word'|'keep'|'num'|'connector', sepBefore }

  let pendingSep = "";
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (part.sep !== undefined) {
      pendingSep += part.sep;
      i++;
      continue;
    }

    // 1) Phrasen (längste zuerst), über reine Leerzeichen/Bindestriche hinweg
    let matched = null;
    for (const phrase of PHRASE_LIST) {
      const len = phrase.words.length;
      if (len === 1 && phrase.keep) continue; // Einwort-Keeps laufen unten
      let ok = true;
      let j = i;
      const sourceWords = [];
      for (let w = 0; w < len; w++) {
        if (w > 0) {
          // genau ein Trenner (Leerzeichen/Bindestrich) zwischen den Wörtern
          if (!(parts[j] && parts[j].sep !== undefined && isPhraseSep(parts[j].sep))) {
            ok = false;
            break;
          }
          j++;
        }
        const p = parts[j];
        if (!p || p.word === undefined || normWord(p.word) !== phrase.words[w]) {
          ok = false;
          break;
        }
        sourceWords.push(p.word);
        j++;
      }
      if (ok) {
        // Original-Textabschnitt inkl. echter Trenner rekonstruieren
        const raw = parts
          .slice(i, j)
          .map((p) => (p.word !== undefined ? p.word : p.sep))
          .join("");
        matched = { phrase, end: j, source: sourceWords.join(" "), raw };
        break;
      }
    }

    if (matched) {
      const { phrase, end, source, raw } = matched;
      let text;
      let kind;
      if (phrase.keep) {
        text = raw; // Original samt Trennern beibehalten ("Star Wars")
        kind = "brand";
      } else {
        text = phrase.value;
        kind = "phrase";
        // Komplett großgeschriebene Quelle -> Großschreibung übernehmen
        if (source === source.toUpperCase() && source.length > 3) text = text.toUpperCase();
      }
      segments.push({ text, kind, sepBefore: pendingSep });
      pendingSep = "";
      i = end;
      continue;
    }

    // 2) Einzelwort
    const word = part.word;
    const lower = normWord(word);

    if (/\d/.test(word) || ROMAN.has(lower)) {
      segments.push({ text: word, kind: "num", sepBefore: pendingSep });
    } else if (CONNECTORS[lower]) {
      segments.push({ text: CONNECTORS[lower], kind: "connector", sepBefore: pendingSep });
    } else if (WORDS[lower]) {
      let text = WORDS[lower];
      if (word === word.toUpperCase() && word.length > 3) text = text.toUpperCase();
      segments.push({ text, kind: "word", sepBefore: pendingSep });
    } else if (BRANDS.has(lower)) {
      segments.push({ text: word, kind: "brand", sepBefore: pendingSep });
    } else if (KEEP.has(lower)) {
      segments.push({ text: word, kind: "keep", sepBefore: pendingSep });
    } else {
      return null; // unklassifizierbares Wort -> Name bleibt englisch
    }
    pendingSep = "";
    i++;
  }

  // Nachbarschaftsregel gegen zerhackte Komposita und Denglisch-Murks:
  // - Übersetzung direkt gefolgt von Übersetzung/Keep/Brand ("Burg Ritter",
  //   "Zug Set") -> verwerfen.
  // - Generisches Keep-Wort direkt vor einer Übersetzung ("Cool Autos",
  //   "Zoo Zug") -> verwerfen.
  // Erlaubt: Konnektoren und Zahlen beidseitig sowie Marken-/Linien-Namen
  // VOR der Übersetzung ("City Adventskalender", "Basic Bauset").
  // "Direkt" heißt: nur Leerzeichen dazwischen; Satzzeichen entkoppeln.
  for (let s = 1; s < segments.length; s++) {
    const left = segments[s - 1];
    const right = segments[s];
    if (!isWs(right.sepBefore) && right.sepBefore !== "") continue;
    const leftTranslated = left.kind === "word" || left.kind === "phrase";
    const rightTranslated = right.kind === "word" || right.kind === "phrase";
    const rightBlocked = rightTranslated || right.kind === "keep" || right.kind === "brand";
    if (leftTranslated && rightBlocked) return null;
    if (left.kind === "keep" && rightTranslated) return null;
  }

  let out = "";
  for (const seg of segments) {
    out += seg.sepBefore + seg.text;
  }
  out += pendingSep;

  // Satzanfang groß (falls ein kleingeschriebener Konnektor vorn steht)
  out = out.replace(/^([a-zäöü])/, (c) => c.toUpperCase());
  return out;
}

/* ------------------------------------------------------------------ */
/* Hauptprogramm                                                       */
/* ------------------------------------------------------------------ */

const catalog = JSON.parse(readFileSync(join(CATALOG_DIR, "catalog.json"), "utf8"));
const themes = JSON.parse(readFileSync(join(CATALOG_DIR, "themes.json"), "utf8"));

const rootCache = new Map();
function rootThemeOf(id) {
  let r = rootCache.get(id);
  if (r !== undefined) return r;
  let cur = themes[id];
  let guard = 0;
  while (cur && cur.parent && themes[cur.parent] && guard++ < 10) {
    cur = themes[cur.parent];
  }
  r = cur ? cur.name : "-";
  rootCache.set(id, r);
  return r;
}

const names = {};
let considered = 0;
let skippedLicensed = 0;

for (const set of catalog.sets) {
  // Gleiche Sichtbarkeits-Filter wie src/lib/catalog.ts
  if (set.n.startsWith("DATABASE-")) continue;
  if (/unused parts/i.test(set.t) || /database set/i.test(set.t)) continue;
  const root = rootThemeOf(set.th);
  if (NON_BUILDING_ROOT_THEMES.has(root)) continue;

  if (SET_OVERRIDES[set.n]) {
    names[set.n] = SET_OVERRIDES[set.n];
    continue;
  }

  if (LICENSED_ROOT_THEMES.has(root)) {
    skippedLicensed++;
    continue;
  }

  considered++;
  const de = translateName(set.t);
  if (de && de !== set.t) names[set.n] = de;
}

// Stabil sortiert schreiben (deterministische Diffs im Git)
const sorted = Object.fromEntries(Object.entries(names).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(join(CATALOG_DIR, "names-de.json"), JSON.stringify(sorted));

const translated = Object.keys(sorted).length;
console.log(
  `[names-de] ${translated} deutsche Namen geschrieben ` +
    `(${considered} Nicht-Lizenz-Sets geprüft, ${skippedLicensed} Lizenz-Sets übersprungen).`
);
const samples = Object.entries(sorted).slice(0, 12);
for (const [id, de] of samples) {
  const orig = catalog.sets.find((s) => s.n === id);
  console.log(`  ${id}: "${orig ? orig.t : "?"}" -> "${de}"`);
}
