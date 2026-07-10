# BrickSpecs Leak-Bot (Phase 3)

Ziel: Ein Agent überwacht Leak-Quellen (StoneWars, Promobricks, Brick Fanatics,
Instagram-Leaker) und Deal-Quellen (Amazon, Alternate, Smyths …) und postet neue
Funde **in Sekunden** in die eigenen Kanäle.

**Echte Kanäle des Betreibers:**

- WhatsApp-Kanal: <https://whatsapp.com/channel/0029VbDHqsvGk1G1f1jn3D11>
- Telegram-Kanal: <https://t.me/brickspecs> (`@brickspecs`)

Telegram lässt sich über die offizielle Bot-API **kostenlos** automatisieren.
WhatsApp-Channel-Posting hat keine offizielle API von Meta und braucht weiterhin
einen Drittanbieter (z. B. Whapi.cloud oder 360dialog).

## Architektur

```
Quellen-Watcher (Cron, alle 5-10 Min)
   └─> Neuigkeit erkannt? ─> dedupe (posted.json)
        └─> Typ-Filter (--post-types, Default deal,leak)
             └─> post-leak.mjs ─> Adapter (laufen unabhängig voneinander):
                   ├─ console  (Standard, wenn nichts konfiguriert ist - zum Testen)
                   ├─ whatsapp (via Anbieter-API, z. B. Whapi.cloud / 360dialog)
                   └─ telegram (offizielle Bot-API, kostenlos)
```

Gleichzeitig landet **jeder** Fund (auch nicht gepostete News) in `inbox.json`,
dem redaktionellen Posteingang.

## Watcher (`watch-sources.mjs`)

Der Quellen-Watcher zieht echte RSS-Feeds - reines Node (>= 18), keine
npm-Dependencies.

**Quellen** (Array `SOURCES` im Skript, leicht erweiterbar):
StoneWars, Promobricks, Brick Fanatics, zusammengebaut.

**Ablauf pro Lauf:**
1. Feeds mit Browser-User-Agent abrufen (StoneWars blockt manche Bot-Clients);
   nicht erreichbare Quellen werden sauber übersprungen und im Log vermerkt.
2. RSS-Items parsen (title, link, pubDate, description; CDATA/HTML-Entities
   bereinigt, description auf ~300 Zeichen gekürzt).
3. Dedupe über `posted.json` (Liste schon gesehener Links; wird automatisch
   angelegt und nach jedem Lauf aktualisiert, max. 2000 Einträge).
4. Klassifizierung per Titel-Keywords: **deal** (angebot/rabatt/deal/sale/%),
   **leak** (leak/gerücht/rumor/erster blick), sonst **news**.
5. **Struktur-Extraktion** aus Titel + Beschreibung:
   - **Setnummer:** erste 4-6-stellige Zahl im Titel mit LEGO-Kontext;
     Jahreszahlen (19xx/20xx) werden ausgeschlossen
     (`LEGO Technic 42238 Ducati …` -> `42238`).
   - **Preis/UVP:** Muster wie `für 34,99 Euro`, `34,99 €`; Beträge mit
     UVP/RRP/statt-Kontext zählen als UVP. Aus Rabatt-Prozenten
     (`25% Rabatt`) plus UVP wird der Preis berechnet - und umgekehrt.
     Dollar-Preise (`for $29.99`) werden erkannt, aber nicht als EUR gewertet.
   - **Shop:** Keywords amazon/alternate/smyths/mediamarkt/lego shop bzw.
     lego.com/ebay, normalisiert (z. B. `Smyths Toys`, `LEGO Shop`).
   - **Kauf-Link:** bei bekannter Setnummer ODER Shop=Amazon eine
     Amazon-Suche (`https://www.amazon.de/s?k=LEGO+<setnr>`); der
     Affiliate-Tag kommt erst in `post-leak.mjs` dran.
   - **Thema:** bekannter Themen-Name im Titel (`LEGO Icons`, `LEGO Star
     Wars`, …) für die Kopfzeile des Posts.
6. Funde der Typen aus `--post-types` (Default `deal,leak`) gehen an
   `post-leak.mjs` - inkl. `--source`, `--url` und den extrahierten Feldern
   (`--set/--shop/--price/--rrp/--buy-url/--theme`). **Alle** Funde landen
   zusätzlich als JSON-Objekte in `inbox.json`
   (`{id, type, title, body, url, source, set, shop, priceEUR, rrpEUR,
   buyUrl, postedAt}`; unbekannte Felder sind `null`). So fluten reine News
   die Kanäle nicht, gehen aber der Redaktion nicht verloren.

Die Extraktions-Helfer (`extractSetNumber`, `extractPricing`, `extractShop`,
`extractTheme`, `buildBuyUrl`) sind exportiert; beim Import läuft das Skript
dank Main-Guard nicht los - so lassen sie sich ohne Netz und Secrets testen.

`inbox.json` ist der **redaktionelle Posteingang** - er wird NICHT automatisch
in die Website (`src/data/leaks.ts`) übernommen; das bleibt eine bewusste
Redaktionsentscheidung.

**Manuell starten:**

```
node automation/leak-bot/watch-sources.mjs                        # echter Lauf (postet deal + leak)
node automation/leak-bot/watch-sources.mjs --dry-run              # nur anzeigen, nichts schreiben/posten
node automation/leak-bot/watch-sources.mjs --post-types deal      # nur Deals an die Kanäle
node automation/leak-bot/watch-sources.mjs --post-types deal,leak,news  # alles posten
```

**Flags:**

| Flag | Default | Wirkung |
| --- | --- | --- |
| `--dry-run` | aus | Zeigt neue Funde an (inkl. Markierung POST / nur Inbox), schreibt und postet nichts. |
| `--post-types` | `deal,leak` | Kommagetrennte Typen, die an die Kanäle gehen. Alle Funde landen trotzdem in `inbox.json`. |

**Alle 10 Minuten per Windows Scheduled Task** (PowerShell als Admin, Pfad ggf. anpassen):

```powershell
$action  = New-ScheduledTaskAction -Execute "node" `
  -Argument "automation/leak-bot/watch-sources.mjs" `
  -WorkingDirectory "C:\Users\Mike\Desktop\Claude\bricktopia"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
  -RepetitionInterval (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName "BrickSpecs Leak-Watcher" `
  -Action $action -Trigger $trigger
```

Alternativ auf Linux/macOS per Cron: `*/10 * * * * cd /pfad/zu/bricktopia && node automation/leak-bot/watch-sources.mjs`

## Poster (`post-leak.mjs`)

```
node automation/leak-bot/post-leak.mjs --type leak|deal|news --title "…" --body "…"
  [--url "…"] [--price 99.99] [--rrp 149.99]
  [--set 10326] [--shop Amazon] [--buy-url "…"] [--theme "LEGO Icons"]
  [--source StoneWars]
  [--lang de|en|both] [--title-en "…"] [--body-en "…"]
```

**Nachrichtenformat** (Telegram-HTML, Labels englisch; Zeilen ohne Daten
werden weggelassen - ohne die neuen Args entsteht ein sauberes einfaches
Format aus Badge, Titel, Body, Preis und Quelle):

```
🔥 DEAL | LEGO Icons

LEGO Icons Eiffelturm            <- fett
Set 10307

💶 214.99 EUR (RRP 269.99 EUR)
📉 -20%
🏪 Shop: Amazon
🛒 Buy: Amazon                   <- Link, mit Affiliate-Tag
ℹ️ Source: StoneWars             <- Link zum Artikel

* Affiliate link - we may earn a commission.
```

Typ-Badges: `DEAL` 🔥, `LEAK` 🔍, `NEWS` 📰. Der Rabatt wird aus Preis+UVP
berechnet. Produktname/Body bleiben wie geliefert (keine Übersetzung).

**Flags:**

| Flag | Default | Wirkung |
| --- | --- | --- |
| `--type` | `leak` | Typ-Badge in der Kopfzeile (DEAL 🔥, LEAK 🔍, NEWS 📰). |
| `--title` / `--body` | - | Produktname/Text (`--title` ist Pflicht). |
| `--url` | - | Link zum Artikel (Source-Zeile, Telegram-Vorschau). |
| `--price` / `--rrp` | - | Preisblock inkl. berechnetem Rabatt in %. |
| `--set` | - | Setnummer, erscheint als eigene Zeile (`Set 10326`). |
| `--shop` | - | Händler-Name für die Shop-Zeile (`🏪 Shop: Amazon`). |
| `--buy-url` | - | Kauf-Link (`🛒 Buy:`); amazon.*-URLs bekommen den Affiliate-Tag. |
| `--theme` | - | Thema für die Kopfzeile (`🔥 DEAL \| LEGO Icons`). |
| `--source` | - | Quellname als Link-Text der Source-Zeile (sonst Hostname). |
| `--lang` | Env `BOT_LANG` oder `de` | `de`, `en` oder `both`. Bei `both` wird DE + EN untereinander gepostet, sofern `--title-en`/`--body-en` übergeben wurden - sonst nur die vorhandene Sprache. |
| `--title-en` / `--body-en` | - | Englische Variante für `--lang en` bzw. `both`. |

**Adapter** (laufen unabhängig; ein Fehler blockiert den anderen nicht):

- **WhatsApp:** aktiv, sobald `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN` und
  `WHATSAPP_CHANNEL_ID` gesetzt sind. Gleiche Struktur im WhatsApp-Format
  (`*fett*`, nackte URLs statt `<a>`-Links).
- **Telegram:** aktiv, sobald `TELEGRAM_BOT_TOKEN` gesetzt ist. Postet per
  offizieller Bot-API (`sendMessage`) an `TELEGRAM_CHAT_ID` (Default
  `@brickspecs`) mit `parse_mode=HTML`. Der Haupt-Kanal bekommt **immer die
  englische Label-Variante**.
- **Telegram DE-Kanal (optional):** ist zusätzlich `TELEGRAM_CHAT_ID_DE`
  gesetzt, geht dieselbe Nachricht mit **deutschen Labels** an diesen Kanal
  (gleicher Bot-Token; der Bot muss auch dort Admin sein): `💶 214,99 €
  (UVP 269,99 €)`, `🛒 Kaufen`, `ℹ️ Quelle`. Vorbereitung für einen
  deutschsprachigen Zweitkanal - Produktnamen werden dabei NICHT übersetzt.
- **Konsole:** wenn keiner der beiden konfiguriert ist, wird die Nachricht nur
  geloggt - gewollt, so lässt sich alles ohne Secrets testen.

Am Ende loggt das Skript, welche Adapter gepostet haben
(`[leak-bot] Gepostet via whatsapp, telegram, telegram-de.`). Schlagen ALLE
konfigurierten Adapter fehl, endet das Skript mit Exit-Code 1.

## Amazon-Affiliate (PartnerNet)

Ist `AMAZON_AFFILIATE_TAG` gesetzt (z. B. `brickspecs-21`), hängt
`post-leak.mjs` an **jede amazon.*-URL** (aus `--buy-url` oder `--url`) den
Query-Parameter `tag=<WERT>` an. Ein schon vorhandener `tag`-Parameter wird
ersetzt, alle anderen Parameter bleiben erhalten. Ohne die Env bleiben URLs
unverändert.

Wichtig:

- Der Tag kommt aus dem **Amazon-PartnerNet-Konto** (partnernet.amazon.de) -
  ohne genehmigtes PartnerNet-Konto funktionieren die Links nicht als
  Affiliate-Links und verstoßen ggf. gegen die Amazon-Bedingungen.
- **Kennzeichnungspflicht:** Affiliate-Links müssen als Werbung gekennzeichnet
  sein. Der Bot hängt deshalb automatisch einen Hinweis an getaggte Posts
  (`* Affiliate link - we may earn a commission.` bzw. DE-Variante).
  Zusätzlich sollte die Kanal-Beschreibung einen dauerhaften Affiliate-Hinweis
  enthalten.
- Für die Kauf-Links auf der Website gibt es die separate Env
  `NEXT_PUBLIC_AMAZON_TAG` (gleicher PartnerNet-Tag, siehe `.env.example`).

## Telegram einrichten (Schritt für Schritt, kostenlos)

1. **Bot anlegen:** In Telegram [@BotFather](https://t.me/BotFather)
   anschreiben, `/newbot` senden, Namen und Username vergeben. BotFather
   antwortet mit dem **Bot-Token** (Format `123456:ABC-…`).
2. **Bot in den Kanal holen:** Im Kanal `@brickspecs` unter
   Kanal-Info -> Administratoren -> Administrator hinzufügen den neuen Bot
   suchen und als Admin hinzufügen (Recht "Nachrichten veröffentlichen"
   genügt). Ohne Admin-Rechte darf der Bot nicht in den Kanal posten.
3. **`.env` füllen** (siehe `.env.example` im Projektroot):
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-…
   TELEGRAM_CHAT_ID=@brickspecs
   TELEGRAM_CHAT_ID_DE=            # optional: zweiter Kanal mit deutschen Labels
   AMAZON_AFFILIATE_TAG=           # optional: PartnerNet-Tag, z. B. brickspecs-21
   BOT_LANG=de
   ```
4. **Testen** (postet echt in den Kanal!):
   ```
   node automation/leak-bot/post-leak.mjs --type news --title "Bot-Test" --body "Hallo aus dem BrickSpecs Leak-Bot"
   ```
   Erwartete Ausgabe: `[leak-bot] Gepostet via telegram.` und die Nachricht
   erscheint im Kanal. Bei `400 Bad Request: chat not found` stimmt die
   `TELEGRAM_CHAT_ID` nicht; bei `403 Forbidden` fehlen die Admin-Rechte.

## WhatsApp: was noch fehlt (vom Betreiber einzurichten)

Der WhatsApp-Kanal existiert bereits
(<https://whatsapp.com/channel/0029VbDHqsvGk1G1f1jn3D11>), aber WhatsApp-Kanäle
haben **keine offizielle Posting-API** von Meta. Zum Automatisieren:

1. **API-Anbieter** wählen: z. B. Whapi.cloud (unterstützt Channel-Posts) oder
   360dialog. Alternative: WhatsApp Business Cloud API + Broadcast-Liste.
2. `.env` anlegen bzw. ergänzen:
   ```
   WHATSAPP_API_URL=…
   WHATSAPP_API_TOKEN=…
   WHATSAPP_CHANNEL_ID=…
   ```
3. Cron/Scheduled Agent aktivieren (z. B. Claude Code Scheduled Task, alle 5-10 Minuten).

Bis dahin postet der Bot nur nach Telegram (sobald der Token gesetzt ist) bzw.
in die Konsole.

## Test ohne Secrets

```
node automation/leak-bot/post-leak.mjs --type deal --theme "LEGO Icons" --title "LEGO Icons Eiffelturm" --set 10307 --price 214.99 --rrp 269.99 --shop Amazon --buy-url "https://www.amazon.de/s?k=LEGO+10307" --url "https://www.stonewars.de/news/beispiel/" --source StoneWars
```

Ohne `.env` wird nur in die Konsole gepostet (kein Telegram-/WhatsApp-Call).
Die Ausgabe ist das Telegram-HTML mit englischen Labels; ist
`TELEGRAM_CHAT_ID_DE` gesetzt, wird zusätzlich die DE-Variante angezeigt.
Mit gesetztem `AMAZON_AFFILIATE_TAG` lässt sich auch das Tagging der
Amazon-URLs gefahrlos prüfen.

```
node automation/leak-bot/watch-sources.mjs --dry-run --post-types deal
```

Zeigt an, welche Funde gepostet würden (nur Deals) und welche nur in die Inbox
gingen - inkl. der extrahierten Felder (Set, Preis/UVP, Shop, Buy-Link,
Thema) - ohne etwas zu schreiben.
