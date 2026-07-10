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
5. Funde der Typen aus `--post-types` (Default `deal,leak`) gehen an
   `post-leak.mjs` - mit Quellname als Body-Prefix (`[StoneWars] …`) und
   `--url`. **Alle** Funde landen zusätzlich als JSON-Objekte in `inbox.json`
   (`{id, type, title, body, url, source, postedAt}`). So fluten reine News
   die Kanäle nicht, gehen aber der Redaktion nicht verloren.

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
  [--lang de|en|both] [--title-en "…"] [--body-en "…"]
```

**Flags:**

| Flag | Default | Wirkung |
| --- | --- | --- |
| `--type` | `leak` | Bestimmt das Icon (deal 💸, news 📰, leak 🔍). |
| `--title` / `--body` | - | Deutscher Titel/Text (`--title` ist Pflicht). |
| `--url` | - | Link zum Artikel (Telegram rendert ihn als `<a>` mit Vorschau). |
| `--price` / `--rrp` | - | Preiszeile inkl. Rabatt in %. |
| `--lang` | Env `BOT_LANG` oder `de` | `de`, `en` oder `both`. Bei `both` wird DE + EN untereinander gepostet, sofern `--title-en`/`--body-en` übergeben wurden - sonst nur die vorhandene Sprache. |
| `--title-en` / `--body-en` | - | Englische Variante für `--lang en` bzw. `both`. |

**Adapter** (laufen unabhängig; ein Fehler blockiert den anderen nicht):

- **WhatsApp:** aktiv, sobald `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN` und
  `WHATSAPP_CHANNEL_ID` gesetzt sind. Nachricht im WhatsApp-Format (`*fett*`).
- **Telegram:** aktiv, sobald `TELEGRAM_BOT_TOKEN` gesetzt ist. Postet per
  offizieller Bot-API (`sendMessage`) an `TELEGRAM_CHAT_ID` (Default
  `@brickspecs`) mit `parse_mode=HTML` (Titel fett, Link als `<a>`,
  Link-Vorschau aktiv).
- **Konsole:** wenn keiner der beiden konfiguriert ist, wird die Nachricht nur
  geloggt - gewollt, so lässt sich alles ohne Secrets testen.

Am Ende loggt das Skript, welche Adapter gepostet haben
(`[leak-bot] Gepostet via whatsapp, telegram.`). Schlagen ALLE konfigurierten
Adapter fehl, endet das Skript mit Exit-Code 1.

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
node automation/leak-bot/post-leak.mjs --type deal --title "Test" --body "Nur ein Test" --lang both --title-en "Test EN" --body-en "Just a test"
```

Ohne `.env` wird nur in die Konsole gepostet (kein Telegram-/WhatsApp-Call).

```
node automation/leak-bot/watch-sources.mjs --dry-run --post-types deal
```

Zeigt an, welche Funde gepostet würden (nur Deals) und welche nur in die Inbox
gingen - ohne etwas zu schreiben.
