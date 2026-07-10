import type { CityIdea } from "./types";

// 12 Ideen für den City-Hub - konkrete Bau-Tipps, DE/EN.
export const CITY_IDEAS: CityIdea[] = [
  {
    id: "u-bahn-unter-der-stadt",
    title: {
      de: "U-Bahn unter der Stadt",
      en: "A subway beneath the city",
    },
    description: {
      de: "Die Königsdisziplin: Setze deine gesamte Stadt auf einen Sockel von zehn bis zwölf Steinen Höhe und lass darunter eine echte Metro fahren. Kurze Züge aus zwei bis drei Wagen mit Akku-Antrieb (Powered Up) meistern enge Radien und brauchen keine stromführenden Schienen im Tunnel. Baue die Bahnhöfe unter abnehmbaren Gebäuden oder Straßenmodulen, damit du jederzeit an die Technik kommst. Ein offener Streckenabschnitt an der Anlagenkante - wie ein aufgeschnittener Querschnitt - macht den Untergrund für Betrachter sichtbar. Warmweiße LED-Streifen an der Tunneldecke und Bahnsteigkanten aus gelben Fliesen sorgen für echte Metro-Atmosphäre.",
      en: "The supreme discipline: put your entire city on a plinth ten to twelve bricks high and run a real metro underneath. Short trains of two to three cars with battery drive (Powered Up) handle tight radii and need no powered rails inside the tunnel. Build the stations under removable buildings or street modules so you can always reach the electronics. An open stretch of track along the table edge - like a cut-away cross section - puts the underground on display. Warm white LED strips on the tunnel ceiling and platform edges made of yellow tiles deliver genuine metro atmosphere.",
    },
    difficulty: "hard",
    emoji: "🚇",
    tags: ["U-Bahn", "Züge", "Untergrund", "Technik"],
  },
  {
    id: "hochbahn-und-s-bahn",
    title: {
      de: "Hochbahn & S-Bahn über der Straße",
      en: "Elevated rail above the streets",
    },
    description: {
      de: "Eine aufgeständerte Trasse verwandelt jede Skyline - und du gewinnst Bahnverkehr, ohne Grundfläche zu opfern. Stützpfeiler aus 2×2-Rundsteinen oder Technic-Liftarmen sollten mindestens zehn Steine Durchfahrtshöhe über der Straße lassen, damit Fahrzeuge und Blickachsen frei bleiben. Mit Bogensteinen unter der Fahrbahn wirkt das Viadukt sofort wie in Chicago, Hamburg oder Berlin. Verzahne die Trassensegmente mit Technic-Pins, denn erhöhte Gleise verzeihen keine wackligen Übergänge. Eine Station über der Straßenkreuzung mit Treppenabgängen ist das perfekte Herzstück.",
      en: "An elevated line transforms any skyline - and you gain rail traffic without sacrificing ground space. Support pillars made of 2×2 round bricks or Technic liftarms should leave at least ten bricks of clearance above the street so vehicles and sightlines stay free. With arch bricks under the trackbed, the viaduct instantly evokes Chicago, Hamburg or Berlin. Lock the track segments together with Technic pins, because elevated rails forgive no wobbly joints. A station above a street intersection with staircases down to the sidewalk makes the perfect centerpiece.",
    },
    difficulty: "hard",
    emoji: "🚈",
    tags: ["Züge", "Hochbahn", "Infrastruktur"],
  },
  {
    id: "hafenviertel",
    title: {
      de: "Hafenviertel mit Kai und Kränen",
      en: "Harbor district with quay and cranes",
    },
    description: {
      de: "Ein Hafen bringt Industrie-Charme und eine natürliche Anlagenkante. Kaimauern gelingen mit Mauerprofilsteinen, das Wasser mit transparenten blauen Fliesen über einer unruhigen Basis aus blauen und dunkelblauen Platten - das Schimmern wirkt erstaunlich echt. Gebaute Container von etwa acht Noppen Länge, ein Portalkran und Lagerhallen mit Gleisanschluss machen daraus ein komplettes Logistik-Viertel. Ein Niveauunterschied lohnt sich: Liegt die Kaikante zwei, drei Steine unter Straßenniveau, bekommen Treppen und Poller ihren großen Auftritt. Fischkutter neben Containerschiff erzählen gleich zwei Geschichten auf einmal.",
      en: "A harbor brings industrial charm and a natural layout edge. Quay walls work beautifully with masonry-profile bricks; the water comes alive with transparent blue tiles over a restless base of blue and dark blue plates - the shimmer looks surprisingly real. Brick-built containers around eight studs long, a gantry crane and warehouses with a rail siding turn it into a complete logistics quarter. A change in level is worth it: set the quay edge two or three bricks below street level and stairs and bollards get their big moment. A fishing cutter next to a container ship tells two stories at once.",
    },
    difficulty: "medium",
    emoji: "⚓",
    tags: ["Hafen", "Wasser", "Industrie"],
  },
  {
    id: "hinterhoefe-und-gassen",
    title: {
      de: "Hinterhöfe & Gassen zwischen den Modulars",
      en: "Backyards & alleys between the modulars",
    },
    description: {
      de: "Der Trick, der jede Modular-Straße echter macht: Lass zwischen zwei Gebäuden eine Gasse von sechs bis acht Noppen frei. Feuertreppen aus Leitern und Gitterelementen, Mülltonnen, eine Wäscheleine aus Schnur zwischen den Fassaden und eine einzelne Straßenkatze erzählen mehr Stadtgeschichte als jede Schaufassade. Bedruckte Fliesen oder dezente Graffiti an den Seitenwänden brechen die großen Flächen auf. Eine einzige warmweiße LED über der Hintertür macht die Gasse nachts zum Filmset. Und auch die Rückseiten der Modulars verdienen Liebe: Hinterhöfe mit Schuppen und Gemüsebeet machen aus Kulissen echte Gebäude.",
      en: "The trick that makes every modular street feel real: leave an alley of six to eight studs between two buildings. Fire escapes made of ladders and grille elements, trash cans, a string clothesline between the facades and a single stray cat tell more urban history than any showpiece frontage. Printed tiles or subtle graffiti on the side walls break up the large surfaces. One single warm white LED above the back door turns the alley into a film set at night. And the backs of your modulars deserve love too: backyards with sheds and a vegetable patch turn stage scenery into real buildings.",
    },
    difficulty: "medium",
    emoji: "🐈",
    tags: ["Modulars", "Details", "Innenstadt"],
  },
  {
    id: "led-beleuchtung",
    title: {
      de: "LED-Beleuchtung von Anfang an",
      en: "LED lighting from day one",
    },
    description: {
      de: "Licht ist der größte Einzel-Hebel für Atmosphäre - aber es will von Anfang an mitgeplant sein. Führe Kabel unter einer MILS-Ebene oder durch hohle Säulen, Regenrohre und Laternenmasten, damit nirgendwo etwas sichtbar baumelt. Mische bewusst: warmweiß für Wohnräume und Laternen, kaltweiß für Büros, Bahnhöfe und Industrie, dazu einzelne Farbakzente für Leuchtreklamen. Verkabele in Abschnitten mit Steckverbindern, damit deine Module transportabel bleiben. Und weniger ist mehr - ein paar dunkle Häuser zwischen den beleuchteten wirken realistischer als eine lückenlose Lichterkette.",
      en: "Light is the single biggest lever for atmosphere - but it wants to be planned in from the start. Route cables beneath a MILS layer or through hollow columns, drainpipes and lamp posts so nothing dangles in sight. Mix deliberately: warm white for living rooms and street lamps, cool white for offices, stations and industry, plus a few color accents for neon signs. Wire in sections with plug connectors so your modules stay transportable. And less is more - a few dark houses between the lit ones look far more realistic than one unbroken chain of lights.",
    },
    difficulty: "medium",
    emoji: "💡",
    tags: ["Beleuchtung", "LED", "Technik"],
  },
  {
    id: "geschwungene-strassen",
    title: {
      de: "Geschwungene Straßen statt Schachbrett",
      en: "Sweeping streets instead of a checkerboard",
    },
    description: {
      de: "Rechte Winkel sind praktisch - aber erst eine geschwungene Hauptstraße macht ein Stadtbild organisch. Die Königslösung sind steingebaute Straßen: dunkelgraue Platten als Fahrbahn, Keilplatten für die Kurvenverläufe, weiße 1×2-Fliesen als Markierung. Gehwege aus hellgrauen Fliesen mit Gullideckeln aus runden 2×2-Fliesen und abgesenkten Bordsteinen wirken sofort städtisch. Ein Kreisverkehr mit bepflanzter Mitte ist das perfekte Übungsprojekt und zugleich ein Blickfang. Wer das aktuelle Straßenplatten-System nutzt, setzt gebaute Kurvensegmente einfach als Übergänge dazwischen.",
      en: "Right angles are convenient - but only a sweeping main street makes a cityscape organic. The gold standard is brick-built roads: dark grey plates as the surface, wedge plates for the curves, white 1×2 tiles as markings. Sidewalks of light grey tiles with manhole covers made of round 2×2 tiles and lowered curbs instantly read as urban. A roundabout with a planted center island is the perfect practice project and an eye-catcher in one. If you use the current road-plate system, simply drop brick-built curve segments in between as transitions.",
    },
    difficulty: "medium",
    emoji: "🛣️",
    tags: ["Straßen", "Layout", "Techniken"],
  },
  {
    id: "vorstadt-vs-innenstadt",
    title: {
      de: "Vorstadt vs. Innenstadt: das Dichtegefälle",
      en: "Suburbs vs. downtown: the density gradient",
    },
    description: {
      de: "Echte Städte werden nach außen hin lockerer - dieses Dichtegefälle lässt sich wunderbar nachbauen. Im Zentrum stehen Modulars Wand an Wand, dann folgen Reihenhäuser mit schmalen Vorgärten, ganz außen Einfamilienhäuser mit Garage, Rasen und Basketballkorb. Auch die Straßen erzählen mit: breite Boulevards innen, schmale Wohnstraßen mit Einfahrten außen. Mehr Grün pro Modul, niedrigere Bauhöhen und größere Grundstücke signalisieren Vorstadt auf einen Blick. Der Übergangsbereich ist der interessanteste Teil - perfekt für Schule, Supermarkt und Feuerwache.",
      en: "Real cities loosen up toward the edges - and this density gradient is wonderfully buildable. Downtown, modulars stand wall to wall; then come row houses with narrow front yards; on the outskirts, single-family homes with a garage, lawn and basketball hoop. The streets tell the story too: wide boulevards in the center, narrow residential roads with driveways further out. More greenery per module, lower building heights and larger lots signal suburbia at a glance. The transition zone is the most interesting part - perfect for the school, the supermarket and the fire station.",
    },
    difficulty: "easy",
    emoji: "🏡",
    tags: ["Layout", "Planung", "Vorstadt"],
  },
  {
    id: "baustelle-mit-kran",
    title: {
      de: "Baustelle mit Turmkran",
      en: "Construction site with tower crane",
    },
    description: {
      de: "Nichts sagt „lebendige Stadt“ so deutlich wie eine Baustelle - denn Städte sind nie fertig. Ein Rohbau aus Technic-Steinen und nackten Platten zeigt Geschossdecken und Treppenkerne; ein Turmkran mit Schnurwinde und Gegengewicht aus grauen Steinen überragt das ganze Viertel. Bauzäune, Sandhaufen aus beigen Schrägsteinen, ein Dixi-Klo und Warnbaken füllen die Szene fast von selbst. Der schönste Nebeneffekt: Die Baustelle darf mit deiner Stadt mitwachsen - alle paar Monate ein Stockwerk mehr, bis irgendwann Richtfest gefeiert wird.",
      en: "Nothing says “living city” as clearly as a construction site - because cities are never finished. A structural shell of Technic bricks and bare plates shows floor slabs and stair cores; a tower crane with a string winch and a counterweight of grey bricks looms over the whole district. Site fences, sand piles made of tan slopes, a portable toilet and traffic beacons fill the scene almost by themselves. The nicest side effect: the site gets to grow with your city - one more floor every few months, until one day you celebrate the topping-out ceremony.",
    },
    difficulty: "easy",
    emoji: "🏗️",
    tags: ["Baustelle", "Szene", "Details"],
  },
  {
    id: "park-und-fluss",
    title: {
      de: "Stadtpark & Flusslauf",
      en: "City park & riverfront",
    },
    description: {
      de: "Grünflächen sind die Atempausen einer Stadt - und der Fluss ist ihre schönste Trennlinie. Lege das Flussbett ein bis zwei Plattenhöhen unter Straßenniveau: transparente blaue Fliesen über einer gemischten Basis aus Blau- und Grüntönen erzeugen echte Tiefe. Ufer entstehen aus Schrägsteinen und Pflanzenelementen, dazu als Faustregel eine Brücke pro 96 Noppen Flusslauf. Im Park funktionieren Wege aus beigen Fliesen, Bänke, ein Teich und ein Kiosk als Treffpunkte; Bäume mischst du am besten aus offiziellen Elementen und selbst gebauten Kronen. Solche Module sind ideale Einsteigerprojekte - schnell gebaut, mit riesiger Wirkung aufs Gesamtbild.",
      en: "Green spaces are a city's breathing room - and the river is its most beautiful dividing line. Sink the riverbed one or two plate heights below street level: transparent blue tiles over a mixed base of blues and greens create real depth. Banks emerge from slopes and plant elements, with one bridge per 96 studs of river as a rule of thumb. In the park, paths of tan tiles, benches, a pond and a kiosk work as gathering spots; for trees, mix official elements with brick-built canopies. Modules like these are ideal starter projects - quick to build, with a huge effect on the overall picture.",
    },
    difficulty: "easy",
    emoji: "🌳",
    tags: ["Park", "Wasser", "Natur"],
  },
  {
    id: "wintervillage-integration",
    title: {
      de: "Winter Village als Wechsel-Quartier",
      en: "Winter Village as a swappable quarter",
    },
    description: {
      de: "Die Winter-Village-Sets sind zu schön für den Karton, passen aber selten zur Sommerstadt. Die Lösung: ein eigenes Quartier auf wechselbaren Modulen. Baue das Winterdorf auf separaten 32×32- oder 48×48-Platten im MILS-Standard - zur Saison tauschst du dann einfach ein ganzes Viertel aus. Schnee entsteht aus weißen Platten und Fliesen; sparsam eingesetzt und mit unregelmäßigen Kanten wirkt er echter als flächendeckendes Weiß. Ein Bahnanschluss mit Pendelzug verbindet das Dorf mit der Innenstadt, und warmweiße Beleuchtung plus ein vereister Teich aus transparenten Fliesen machen den Wintertraum komplett.",
      en: "The Winter Village sets are too beautiful for the box, but they rarely match a summer city. The solution: a dedicated quarter on swappable modules. Build the village on separate 32×32 or 48×48 plates to the MILS standard - then, when the season turns, you simply swap out an entire district. Snow comes from white plates and tiles; used sparingly and with irregular edges, it looks more convincing than wall-to-wall white. A rail link with a shuttle train connects the village to downtown, and warm white lighting plus a frozen pond of transparent tiles complete the winter dream.",
    },
    difficulty: "medium",
    emoji: "❄️",
    tags: ["Winter", "Saisonal", "Module"],
  },
  {
    id: "daecher-mit-leben",
    title: {
      de: "Dächer mit Leben: die fünfte Fassade",
      en: "Rooftops that live: the fifth facade",
    },
    description: {
      de: "Die fünfte Fassade wird fast immer vergessen - dabei schaut man bei Städten auf Tischhöhe ständig auf Dächer. Wassertanks auf Stelzen, Klimageräte aus 1×1-Gittersteinen, Antennen, Oberlichter und ein Taubenschwarm machen aus glatten Flächen Miniatur-Landschaften. Ein Dachcafé mit Lichterkette oder ein Gewächshaus aus transparenten Paneelen schafft echte Hingucker-Momente. Variiere unbedingt die Traufhöhen benachbarter Gebäude um ein paar Steine - nichts wirkt künstlicher als eine schnurgerade Dachlinie. Zugangsluken und Feuerleitern verbinden die Dachwelt logisch mit der Straße.",
      en: "The fifth facade is almost always forgotten - yet with a city at table height, you look at rooftops constantly. Water tanks on stilts, AC units made of 1×1 grille bricks, antennas, skylights and a flock of pigeons turn flat surfaces into miniature landscapes. A rooftop café with a string of lights or a greenhouse made of transparent panels creates genuine wow moments. Be sure to vary the eaves heights of neighboring buildings by a few bricks - nothing looks more artificial than a dead-straight roofline. Access hatches and fire ladders connect the rooftop world logically to the street below.",
    },
    difficulty: "medium",
    emoji: "🏙️",
    tags: ["Dächer", "Details", "Innenstadt"],
  },
  {
    id: "stadt-am-hang",
    title: {
      de: "Stadt am Hang: Ebenen & Topografie",
      en: "Hillside city: levels & topography",
    },
    description: {
      de: "Flache Grundplatten sind der Normalfall - eine Stadt am Hang ist die Kür. Mit gestaffelten MILS-Modulen unterschiedlicher Höhe entstehen Terrassen, auf denen sich Viertel wie in Lissabon oder San Francisco stapeln. Stützmauern aus Mauerprofilsteinen, Treppengassen zwischen den Ebenen und eine kleine Standseilbahn (eine Schnurwinde genügt) machen die Höhenunterschiede erlebbar. Der Bonus für Bahnfans: Tunnelportale und Brücken ergeben sich am Hang wie von selbst. Plane die Wasserführung gleich mit - ein Bachlauf, der über zwei Ebenen in den Stadtfluss fällt, ist das perfekte Finale.",
      en: "Flat baseplates are the default - a hillside city is the freestyle routine. Staggered MILS modules of different heights create terraces where districts stack up like in Lisbon or San Francisco. Retaining walls of masonry-profile bricks, stair alleys between the levels and a small funicular (a string winch is all it takes) make the elevation changes tangible. The bonus for train fans: tunnel portals and bridges emerge on a slope almost by themselves. Plan the water routing right away - a stream cascading down two levels into the city river is the perfect finale.",
    },
    difficulty: "hard",
    emoji: "⛰️",
    tags: ["Topografie", "Ebenen", "Landschaft"],
  },
];
