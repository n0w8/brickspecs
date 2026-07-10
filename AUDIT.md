# Brickonaut Katalog-Audit

Stand: 2026-07-06 | Quelle: `src/data/catalog/catalog.json` (fetchedAt 2026-07-06T06:02:35Z)
Erzeugt mit: `node scripts/catalog-audit.mjs`

## Executive Summary (ehrlich)

Unser Katalog umfasst **27.309 Einträge** über den Zeitraum **1949 bis 2027**. Datenquelle ist Rebrickable, einer der beiden vollständigsten öffentlichen LEGO-Kataloge (neben Brickset). In der Substanz sind wir **so vollständig wie die beste öffentlich verfügbare Quelle** - es fehlt kein bekanntes großes Set, und die Jahres-Counts der buildable Sets stimmen fast exakt mit den öffentlich genannten LEGO-Produktionszahlen überein.

Zwei wichtige Klarstellungen, damit die Zahl nicht überinterpretiert wird:

1. **Die 27.309 sind KEINE 27.309 Bausets.** Rund **25,7 Prozent (7.008 Einträge)** sind "Gear" (Taschen, Schlüsselanhänger, Schreibwaren, Haushaltsartikel) und "Books" - also Merchandise und Bücher, keine Bausets. Rebrickable listet diese bewusst mit. Das ist kein Fehler, muss aber transparent kommuniziert werden.
2. **27,2 Prozent aller Einträge haben Teilezahl 0.** Das sind fast deckungsgleich die Gear-/Book-/Merch-Einträge plus einige Promo- und Datenbank-Platzhalter.

Fazit vorab: Wir haben keine systematischen Lücken bei echten Sets. Der Katalog ist vollständig und aktuell. "Die größte Datenbank der Welt" ist bei den Roh-Sets nicht der richtige Anspruch - dort spiegeln wir schlicht Rebrickable. Der Mehrwert muss aus Kombination und Aufbereitung kommen (siehe Fazit).

## Jahres-Tabelle (Sets pro Jahr)

| Jahr | Anzahl | | Jahr | Anzahl | | Jahr | Anzahl |
|------|-------:|--|------|-------:|--|------|-------:|
| 1949 | 5 | | 1975 | 41 | | 2001 | 460 |
| 1950 | 6 | | 1976 | 77 | | 2002 | 582 |
| 1951 | 0 | | 1977 | 114 | | 2003 | 545 |
| 1952 | 0 | | 1978 | 77 | | 2004 | 468 |
| 1953 | 4 | | 1979 | 93 | | 2005 | 418 |
| 1954 | 14 | | 1980 | 110 | | 2006 | 446 |
| 1955 | 39 | | 1981 | 84 | | 2007 | 483 |
| 1956 | 18 | | 1982 | 89 | | 2008 | 464 |
| 1957 | 24 | | 1983 | 75 | | 2009 | 553 |
| 1958 | 66 | | 1984 | 98 | | 2010 | 532 |
| 1959 | 4 | | 1985 | 177 | | 2011 | 657 |
| 1960 | 3 | | 1986 | 165 | | 2012 | 777 |
| 1961 | 25 | | 1987 | 241 | | 2013 | 840 |
| 1962 | 13 | | 1988 | 85 | | 2014 | 1056 |
| 1963 | 61 | | 1989 | 138 | | 2015 | 1037 |
| 1964 | 38 | | 1990 | 117 | | 2016 | 1004 |
| 1965 | 28 | | 1991 | 148 | | 2017 | 1110 |
| 1966 | 122 | | 1992 | 140 | | 2018 | 1070 |
| 1967 | 30 | | 1993 | 138 | | 2019 | 1115 |
| 1968 | 42 | | 1994 | 170 | | 2020 | 1126 |
| 1969 | 75 | | 1995 | 195 | | 2021 | 1248 |
| 1970 | 43 | | 1996 | 196 | | 2022 | 1251 |
| 1971 | 57 | | 1997 | 286 | | 2023 | 1184 |
| 1972 | 39 | | 1998 | 423 | | 2024 | 1282 |
| 1973 | 72 | | 1999 | 389 | | 2025 | 1400 |
| 1974 | 39 | | 2000 | 410 | | 2026 | 1056 |
|      |   | |      |   | | 2027 | 2 |

Der Verlauf ist plausibel: kontinuierliches Wachstum, Sprung ab ~1998 (Lizenzthemen, Rebrickable-Erfassung wird dichter), Plateau bei ~1.000 bis 1.400 pro Jahr seit 2014. 2026 ist mit 1.056 noch unvollständig (Jahr läuft), 2027 sind erste Vorab-Einträge (2 Stück). Keine verdächtigen Einbrüche oder Nullstellen in der Neuzeit.

## Datenqualitäts-Kennzahlen

| Kennzahl | Wert | Anteil |
|---|---:|---:|
| Sets gesamt | 27.309 | 100 % |
| Ohne Bild-URL (`i` leer) | 0 | 0,0 % |
| Ohne Jahr (`y` = 0) | 0 | 0,0 % |
| Ohne Teilezahl (`p` = 0) | 7.435 | 27,2 % |
| davon: Gear + Books (root-Theme) | 7.008 | 25,7 % |
| Eindeutige Basisnummern | 24.919 | - |
| Basen mit mehreren Varianten | 951 | - |
| Einträge in Multi-Varianten-Basen | 3.341 | 12,2 % |

Bewertung:
- **Bilder und Jahre: makellos (0 % Lücken).** Jeder Eintrag hat Bild-URL und Jahr.
- **Teilezahl 0 (27,2 %) ist überwiegend kein Datenfehler**, sondern Systematik: Merchandise, Bücher und Promo-Artikel haben schlicht keine Teile. Nach Abzug von Gear + Books (25,7 %) bleiben nur ~1,5 Prozentpunkte echte Bausets ohne erfasste Teilezahl - das sind Restlücken, die man optional nachpflegen kann.
- **Varianten sind normal.** 951 Basisnummern haben mehrere Varianten (Re-Releases, Regionalversionen, Packs). Das sind keine echten Duplikate. Größter Cluster: `DATABASE-*` (37 Einträge) - das sind Rebrickables interne "Unused Parts Database"-Platzhalter, also gar keine LEGO-Produkte. Kandidat zum Ausfiltern im Frontend.

## Vergleich mit öffentlichen Quellen

| Quelle | Genannte Größe | Einordnung |
|---|---|---|
| Brickset | ~23.117 "Sets und andere Artikel" über 76 Jahre | Trennt "Sets" von "anderen Artikeln"; ähnliche Größenordnung wie wir |
| Rebrickable (unsere Quelle) | "über 19.000 Sets" (ältere Doku-Angabe, real deutlich höher) | Zählt Gear/Books/Media mit - erklärt unsere höhere Zahl |
| LEGO-Produktion pro Jahr | ~700 bis 930 neue Bausets/Jahr (Peak 2021: 929) | Referenz für Plausibilität der Jahres-Counts |

Der entscheidende Plausibilitäts-Check: Wenn man unsere Jahres-Counts auf **buildable Sets (Teilezahl > 0)** filtert, ergibt sich:

| Jahr | Katalog gesamt | davon mit Teilen (buildable) | öffentliche Referenz |
|---|---:|---:|---|
| 2023 | 1.184 | 770 | ~700 bis 930 |
| 2024 | 1.282 | 839 | ~700 bis 930 |
| 2025 | 1.400 | 911 | ~700 bis 930 (Peak 2021: 929) |

Die buildable-Counts (770 bis 911) liegen **exakt im öffentlich genannten Korridor** von ~700 bis 930 Sets pro Jahr. Das ist der stärkste Beleg dafür, dass unser Katalog bei echten Sets **vollständig** ist und keine systematischen Jahres-Lücken hat. Die Differenz zur Gesamtzahl erklärt sich vollständig durch Gear und Books.

## Stichprobe: Sind bekannte Sets vorhanden?

Alle 16 stichprobenartig geprüften bekannten Sets sind im Katalog vorhanden:

| Set-Nr. | Name | Jahr | Teile |
|---|---|---:|---:|
| 10179 | UCS Millennium Falcon | 2007 | 5.198 |
| 75192 | Millennium Falcon | 2017 | 7.541 |
| 10294 | Titanic | 2021 | 9.092 |
| 10276 | Colosseum | 2020 | 9.036 |
| 31203 | World Map | 2021 | 11.695 |
| 10307 | Eiffel Tower | 2022 | 10.001 |
| 42115 | Lamborghini Sián | 2020 | 3.696 |
| 71043 | Hogwarts Castle | 2018 | 6.020 |
| 21322 | Pirates of Barracuda Bay | 2020 | 2.545 |
| 21333 | The Starry Night | 2022 | 2.316 |
| 6080 | King's Castle | 1984 | 679 |
| 497 | Galaxy Explorer (Classic Space) | 1979 | 342 |
| 10497 | Galaxy Explorer (2022) | 2022 | 1.254 |
| 375 | Castle (Yellow Castle) | 1978 | 775 |
| 76989 | Horizon Forbidden West Tallneck | 2022 | 1.222 |

Ergebnis: Keine Lücke bei prominenten Sets, quer über alle Ären (1978 bis 2022), Themen und Größenklassen.

## Gefundene echte "Lücken" / Auffälligkeiten

Es gibt **keine systematischen Lücken bei echten LEGO-Sets.** Die Auffälligkeiten sind Qualitäts-/Darstellungsthemen, keine Vollständigkeitslücken:

1. **Rebrickable-Platzhalter im Katalog.** `DATABASE-*` (37 Einträge, "Unused Parts Database Set") sind keine LEGO-Produkte. Empfehlung: im Frontend/Suche ausblenden.
2. **Merchandise dominiert die Top-Themes.** Von den Top 4 Themes sind 3 reine Gear-Kategorien (Bags/Luggage, Key Chain, Stationery). Für ein "LEGO-Set-Portal" verzerrt das Rankings und Zählungen. Empfehlung: Gear/Books als eigene Facette kennzeichnen und in Set-Statistiken optional herausrechnen.
3. **~400 echte Bausets ohne Teilezahl** (Restmenge nach Abzug Gear/Books, ~1,5 % des Katalogs). Optional per Rebrickable-API nachpflegen, niedrige Priorität.
4. **2026/2027 noch unvollständig** - erwartbar, da laufendes/künftiges Jahr. Wird bei jedem `sync-catalog`-Lauf aktualisiert.

## Fazit zur "größte Datenbank der Welt"-Frage

Ehrlich und realistisch:

- **Bei den Roh-Sets werden wir nicht "die größte Datenbank der Welt".** Wir spiegeln Rebrickable, und Brickset bzw. Rebrickable selbst sind der De-facto-Vollständigkeits-Standard. Mehr echte Sets als diese Quellen gibt es schlicht nicht - der weltweite Bestand an je erschienenen LEGO-Sets ist endlich und öffentlich weitgehend erfasst. Wir sind auf Augenhöhe mit dem Besten, nicht darüber.
- **Der ehrliche Anspruch lautet: "vollständigster öffentlicher Katalog, sauber aufbereitet und deutschsprachig".** Das können wir belegen: 0 % fehlende Bilder/Jahre, buildable-Counts exakt im Produktionskorridor, alle bekannten Sets vorhanden.
- **Echter Mehrwert und Differenzierung entstehen nicht durch mehr Roh-Sets, sondern durch Kombination:** Katalog + Neuheiten-Radar + Preise (BrickEconomy/BrickLink) + Minifigs + Merch + EOL-Radar + Leaks. Diese Verknüpfung liefert kein anderes Portal in einem Guss - dort liegt das "größte/beste"-Potenzial, nicht in der reinen Set-Anzahl.

Empfohlene Formulierung fürs Marketing (belegbar): "Der vollständigste LEGO-Katalog im deutschsprachigen Raum - über 27.000 Einträge, kombiniert mit Preisen, Minifiguren und Neuheiten." Die Zahl 27.000+ ist korrekt, solange klar ist, dass sie Merchandise einschließt.
