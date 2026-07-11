# Newsletter-Digest (Brevo)

Taeglicher E-Mail-Digest mit neuen LEGO-Deals, GWPs und Leaks aus
`automation/leak-bot/inbox.json`. Versand als Brevo-Kampagne an die
Newsletter-Liste; die Anmeldung laeuft ueber das Formular auf der Website
(`/api/newsletter`).

## Dateien

| Datei | Zweck |
| --- | --- |
| `send-digest.mjs` | Baut die HTML-Mail und verschickt sie via Brevo-API (ohne `BREVO_API_KEY`: Dry-Run in die Konsole) |
| `last-digest.json` | Versand-Stand (`{ "lastPostedAt": "..." }`), wird vom Workflow committet |
| `../../.github/workflows/newsletter-digest.yml` | Taeglicher Lauf um 06:45 UTC + manueller Start |

## Setup beim Betreiber (einmalig)

1. Kostenloses Konto auf [brevo.com](https://www.brevo.com) anlegen (Free-Plan reicht: 300 Mails/Tag).
2. **Kontakte -> Listen**: Liste `BrickSpecs Alarm` anlegen und die **Listen-ID** notieren (Zahl in der Uebersicht).
3. **SMTP & API -> API-Schluessel**: neuen API-Key erzeugen.
4. **Absender & IP -> Absender**: Absender-Adresse (z. B. `alarm@brickspecs.com`) anlegen und per Bestaetigungs-Mail **verifizieren**. Fuer gute Zustellraten die Domain (SPF/DKIM) nach Brevo-Anleitung verifizieren.
5. **GitHub -> Repo -> Settings -> Secrets and variables -> Actions**, jeweils als Secret:
   - `BREVO_API_KEY`
   - `BREVO_LIST_ID`
   - `BREVO_SENDER_EMAIL`
   - `AMAZON_AFFILIATE_TAG` (falls noch nicht vorhanden, z. B. `brickspecs-21`)
6. **Vercel -> Project -> Settings -> Environment Variables** (fuer die Anmelde-API auf der Website):
   - `BREVO_API_KEY`
   - `BREVO_LIST_ID`
   - `BREVO_DOI_TEMPLATE_ID` (empfohlen, siehe DSGVO unten)

Ohne die Vercel-Variablen antwortet `/api/newsletter` mit 503 und der Meldung
"Der Newsletter startet in Kuerze" - das Formular kann also gefahrlos live sein.

## Test

```bash
node automation/newsletter/send-digest.mjs   # ohne BREVO_API_KEY = Dry-Run, loggt die Mail
```

Erst wenn `BREVO_API_KEY` gesetzt ist, wird wirklich versendet und
`last-digest.json` aktualisiert. Pro Mail max. 20 neueste Eintraege.

## DSGVO

- **Double-Opt-in aktivieren (empfohlen):** In Brevo unter Kampagnen ->
  Vorlagen eine Double-Opt-in-Bestaetigungsvorlage anlegen (Brevo bringt eine
  Standard-DOI-Vorlage mit, die Vorlage muss den `{{ doubleoptin }}`-Link
  enthalten). Die **Template-ID** als `BREVO_DOI_TEMPLATE_ID` in Vercel
  eintragen - dann verschickt die Anmelde-API eine Bestaetigungs-Mail statt
  direkt einzutragen.
- **Datenschutzerklaerung ergaenzen:** Abschnitt Newsletter mit Zweck
  (Deals/GWP-Alarme), Anbieter Brevo (Sendinblue GmbH, Deutschland/EU),
  Rechtsgrundlage Einwilligung, Widerruf per Abmeldelink, Hinweis auf
  Affiliate-Links in den Mails.
- Der Abmeldelink (`{{ unsubscribe }}`) und die Affiliate-Kennzeichnung sind
  in jeder Digest-Mail fest eingebaut.
