// DE->EN-Synonym-Erweiterung für die Katalogsuche. Die Katalognamen sind
// englisch (Rebrickable) - deutsche Suchbegriffe wie "Polizeistation" würden
// sonst nichts finden. expandSearchQuery() liefert zu einer (deutschen)
// Query zusätzliche englische Suchbegriffe, mit denen die Suche ERGÄNZEND
// durchgeführt wird (Original-Treffer bleiben vorn).
//
// Reines String-Modul ohne Abhängigkeiten - darf überall importiert werden.

/** Häufige deutsche LEGO-Suchbegriffe -> englische Katalogbegriffe. */
const RAW_SYNONYMS: Record<string, string[]> = {
  // Stadt, Rettung, Verkehr
  polizei: ["police"],
  polizeistation: ["police station"],
  polizeiwache: ["police station"],
  polizeiauto: ["police car"],
  polizeihubschrauber: ["police helicopter"],
  feuerwehr: ["fire"],
  feuerwehrstation: ["fire station"],
  feuerwache: ["fire station"],
  feuerwehrauto: ["fire truck"],
  "löschfahrzeug": ["fire truck", "fire engine"],
  feuerwehrboot: ["fire boat"],
  krankenhaus: ["hospital"],
  krankenwagen: ["ambulance"],
  rettungswagen: ["ambulance"],
  arzt: ["doctor"],
  bahnhof: ["train station"],
  zug: ["train"],
  eisenbahn: ["train"],
  "güterzug": ["cargo train", "freight train"],
  personenzug: ["passenger train"],
  "straßenbahn": ["tram", "streetcar"],
  lokomotive: ["locomotive"],
  flughafen: ["airport"],
  flugzeug: ["plane", "airplane"],
  hubschrauber: ["helicopter"],
  auto: ["car"],
  autos: ["car"],
  lastwagen: ["truck"],
  lkw: ["truck"],
  abschleppwagen: ["tow truck"],
  "müllauto": ["garbage truck"],
  "müllwagen": ["garbage truck"],
  "müllabfuhr": ["garbage truck"],
  rennwagen: ["race car", "racing car"],
  rennauto: ["race car"],
  motorrad: ["motorcycle", "motorbike"],
  fahrrad: ["bicycle", "bike"],
  traktor: ["tractor"],
  boot: ["boat"],
  uboot: ["submarine"],
  schiff: ["ship"],
  segelschiff: ["sailing ship"],
  tankstelle: ["gas station", "service station"],
  werkstatt: ["garage", "workshop"],
  autowerkstatt: ["garage"],
  baustelle: ["construction"],
  kran: ["crane"],
  bagger: ["excavator", "digger"],
  planierraupe: ["bulldozer"],
  betonmischer: ["cement mixer", "concrete mixer"],
  gabelstapler: ["forklift"],
  kipper: ["dump truck"],
  bauernhof: ["farm"],
  "gefängnis": ["prison", "jail"],

  // Burg, Ritter, Piraten, Fantasy
  burg: ["castle"],
  ritterburg: ["castle"],
  ritter: ["knight"],
  "könig": ["king"],
  "königin": ["queen"],
  prinzessin: ["princess"],
  prinz: ["prince"],
  schloss: ["castle"],
  wache: ["guard"],
  soldat: ["soldier"],
  soldaten: ["soldier"],
  pirat: ["pirate"],
  piraten: ["pirates", "pirate"],
  piratenschiff: ["pirate ship"],
  wikinger: ["viking"],
  drache: ["dragon"],
  drachen: ["dragon"],
  zauberer: ["wizard"],
  hexe: ["witch"],
  geist: ["ghost"],
  geisterhaus: ["haunted house"],
  gespensterhaus: ["haunted house"],
  spukhaus: ["haunted house"],
  skelett: ["skeleton"],
  vampir: ["vampire"],
  einhorn: ["unicorn"],
  roboter: ["robot"],

  // Weltraum
  weltraum: ["space"],
  weltall: ["space"],
  raumschiff: ["spaceship", "space ship"],
  raumstation: ["space station"],
  rakete: ["rocket"],
  mond: ["moon"],
  mondbasis: ["moon base"],
  stern: ["star"],
  sterne: ["star"],

  // Tiere, Natur
  dino: ["dino", "dinosaur"],
  dinosaurier: ["dinosaur"],
  hai: ["shark"],
  wal: ["whale"],
  pferd: ["horse"],
  pferde: ["horse"],
  "löwe": ["lion"],
  "bär": ["bear"],
  affe: ["monkey"],
  elefant: ["elephant"],
  katze: ["cat"],
  hund: ["dog"],
  ente: ["duck"],
  adler: ["eagle"],
  papagei: ["parrot"],
  "schildkröte": ["turtle"],
  krokodil: ["crocodile"],
  schlange: ["snake"],
  unterwasser: ["underwater"],
  taucher: ["diver"],
  "wüste": ["desert"],
  dschungel: ["jungle"],
  arktis: ["arctic"],
  insel: ["island"],
  strand: ["beach"],
  meer: ["sea", "ocean"],
  ozean: ["ocean"],
  vulkan: ["volcano"],
  berg: ["mountain"],
  blume: ["flower"],
  blumen: ["flowers", "flower"],
  "blumenstrauß": ["bouquet", "flower bouquet"],
  baum: ["tree"],
  baumhaus: ["tree house", "treehouse"],

  // Stadtleben, Gebäude, Anlässe
  haus: ["house"],
  stadthaus: ["townhouse", "town house"],
  wohnhaus: ["house"],
  "straße": ["street"],
  marktplatz: ["market"],
  markt: ["market"],
  cafe: ["café"],
  kino: ["cinema", "movie theater"],
  schule: ["school"],
  schulbus: ["school bus"],
  bibliothek: ["library"],
  "bücherei": ["library"],
  achterbahn: ["roller coaster"],
  riesenrad: ["ferris wheel"],
  karussell: ["carousel", "merry-go-round"],
  jahrmarkt: ["fair", "fairground"],
  freizeitpark: ["amusement park"],
  weihnachten: ["christmas"],
  weihnachtsmann: ["santa"],
  adventskalender: ["advent calendar"],
  ostern: ["easter"],
  osterhase: ["easter bunny"],
  geburtstag: ["birthday"],
};

/** Umlaute als Digraph: löschfahrzeug -> loeschfahrzeug */
function foldUmlauts(s: string): string {
  return s
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

/** Umlaute als Grundvokal: löschfahrzeug -> loschfahrzeug */
function stripUmlauts(s: string): string {
  return s
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss");
}

/** Kleinschreibung, Bindestriche/Mehrfach-Spaces vereinheitlichen. */
function normalizeBase(s: string): string {
  return s
    .toLowerCase()
    .replace(/é/g, "e")
    .replace(/[-–—_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Lookup-Map: jeder deutsche Begriff ist unter drei Schreibweisen erreichbar
// (echte Umlaute, ue/oe/ae-Form, u/o/a-Form).
const SYNONYMS = new Map<string, string[]>();
for (const [key, values] of Object.entries(RAW_SYNONYMS)) {
  const k = key.toLowerCase();
  for (const variant of new Set([k, foldUmlauts(k), stripUmlauts(k)])) {
    if (!SYNONYMS.has(variant)) SYNONYMS.set(variant, values);
  }
}

function lookup(term: string): string[] {
  if (!term) return [];
  for (const candidate of new Set([term, foldUmlauts(term), stripUmlauts(term)])) {
    const hit = SYNONYMS.get(candidate);
    if (hit) return hit;
  }
  return [];
}

/** Anzahl der deutschen Einträge (für Tests/Reports). */
export const SYNONYM_ENTRY_COUNT = Object.keys(RAW_SYNONYMS).length;

/**
 * Liefert zusätzliche englische Suchbegriffe zu einer (deutschen) Query.
 * Geprüft werden die Gesamtphrase, die zusammengezogene Phrase
 * ("polizei station" -> "polizeistation") und jedes einzelne Wort.
 * Die Original-Query selbst ist nie Teil des Ergebnisses.
 */
export function expandSearchQuery(query: string): string[] {
  const base = normalizeBase(query);
  if (!base) return [];

  const out = new Set<string>();

  // 1) Gesamtphrase, direkt und zusammengezogen
  for (const t of lookup(base)) out.add(t);
  const compact = base.replace(/ /g, "");
  if (compact !== base) for (const t of lookup(compact)) out.add(t);

  // 2) Wortweise Übersetzung ("polizei station" -> "police station").
  //    Unübersetzte Wörter bleiben stehen; nur wenn mindestens ein Wort
  //    übersetzt wurde, entsteht eine neue Phrase.
  const words = base.split(" ");
  const anyTranslated = words.some((w) => lookup(w).length > 0);
  if (anyTranslated) {
    let phrases: string[] = [""];
    for (const word of words) {
      const options = lookup(word);
      const opts = options.length > 0 ? options : [word];
      const next: string[] = [];
      for (const p of phrases) {
        for (const o of opts) {
          next.push(p ? `${p} ${o}` : o);
          if (next.length >= 24) break;
        }
        if (next.length >= 24) break;
      }
      phrases = next;
    }
    for (const p of phrases) out.add(p);
  }

  out.delete(base);
  out.delete(query.trim().toLowerCase());
  return Array.from(out);
}
