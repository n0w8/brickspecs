# Brickonaut Live-Deployment - Schritt für Schritt

Stand: 07.07.2026. Ziel: Seite läuft 24/7 auf Vercel, Katalog-Sync und
Deal-Watcher laufen automatisch über GitHub Actions. Laufende Kosten: 0 EUR
(nur Domain ~12 EUR/Jahr).

## Was schon fertig ist (im Repo enthalten)

- Git-Repo initialisiert, .gitignore sauber (keine Secrets im Repo)
- `next.config.ts`: Katalog-JSONs werden in die Vercel-Functions gebündelt
- `vercel.json`: Watcher-Commits (nur automation/) lösen KEIN Deployment aus
- `.github/workflows/catalog-sync.yml`: täglich 07:00 MESZ neue Sets ziehen + committen
- `.github/workflows/leak-watcher.yml`: alle 15 Min Deals/Leaks prüfen + in Kanäle posten

## Schritt 1: Domain kaufen (deine Aufgabe, 10 Min)

brickonaut.com und brickonaut.app sind inzwischen vergeben. Freie Optionen
(Stand 07.07.2026): brickonauts.com, brickonaut.de, brickonaut.io,
brickonaut.net, thebrickonaut.com. Kauf bei easyname (hast du schon) oder
Namecheap - egal, die DNS-Einstellungen funktionieren überall gleich.
Tipp: Haupt-Domain + brickonaut.de als Zweit-Domain (Weiterleitung) sichern.

## Schritt 2: GitHub-Repo (2 Min)

Dein bestehendes GitHub-Konto reicht völlig - Repos sind voneinander
getrennt, der Viking-Blog stört nicht. Entweder legt Claude das private Repo
per `gh` CLI an und pusht, oder manuell: github.com -> New repository ->
Name "brickonaut" -> Private -> Create (OHNE README/gitignore-Haken), dann:

```
cd C:\Users\Mike\Desktop\Claude\bricktopia
git remote add origin https://github.com/DEIN-USER/brickonaut.git
git push -u origin main
```

## Schritt 3: Vercel-Konto + Import (10 Min)

1. vercel.com -> "Sign Up" -> "Continue with GitHub" (nutzt dein GitHub-Login)
2. Dashboard -> "Add New..." -> "Project" -> Repo "brickonaut" -> "Import"
3. Framework wird automatisch als Next.js erkannt - nichts ändern
4. "Environment Variables" aufklappen und eintragen:
   - `NEXT_PUBLIC_SITE_URL` = `https://DEINE-DOMAIN` (z. B. https://brickonauts.com)
   - optional später: `BRICKLINK_CONSUMER_KEY/SECRET`, `BRICKLINK_TOKEN_VALUE/SECRET`
     (schaltet echte Marktpreise frei)
5. "Deploy" klicken -> nach ~2 Min ist die Seite unter
   `brickonaut-xxxx.vercel.app` live

## Schritt 4: Domain verbinden (5 Min + DNS-Wartezeit)

1. Vercel -> Projekt -> Settings -> Domains -> Domain eintragen
2. Vercel zeigt dir die nötigen DNS-Einträge an, typisch:
   - A-Record `@` -> `76.76.21.21`
   - CNAME `www` -> `cname.vercel-dns.com`
3. Diese Werte beim Registrar (easyname: Domains -> DNS-Verwaltung) eintragen
4. Warten (Minuten bis wenige Stunden), Vercel zeigt grünen Haken + HTTPS läuft automatisch

## Schritt 5: GitHub-Secrets für die Automatisierung (5 Min)

GitHub -> Repo brickonaut -> Settings -> Secrets and variables -> Actions
-> "New repository secret":

| Secret | Wert | Zweck |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Token vom @BotFather (`/newbot`) | Deal-Posts in den Telegram-Kanal |
| `TELEGRAM_CHAT_ID` | `@brickdex` (bzw. neuer Kanalname) | Ziel-Kanal |
| `WHATSAPP_API_URL/TOKEN/CHANNEL_ID` | vom Anbieter (z. B. Whapi.cloud) | WhatsApp-Posts (optional, später) |

Wichtig: Den Telegram-Bot im Kanal als Administrator hinzufügen
(Recht "Nachrichten veröffentlichen").

## Schritt 6: Automatisierung testen (5 Min)

1. GitHub -> Repo -> Actions -> "Katalog-Sync" -> "Run workflow" -> grüner Lauf?
2. Actions -> "Leak-Watcher" -> "Run workflow" -> postet neue Deals in den Kanal
3. Ab jetzt läuft beides automatisch (täglich bzw. alle 15 Minuten),
   komplett ohne deinen PC

## Danach (Phase 2, bei Bedarf)

- Supabase (kostenlos) für echte Accounts + serverseitige Portfolios/Alerts
- BrickLink-API-Keys -> Live-Marktpreise statt Demo-Modell
- Persönliche Portfolio-Preisalarme als Telegram-DM/ntfy-Push aufs Handy
- Stripe für die Mitgliedschaften
