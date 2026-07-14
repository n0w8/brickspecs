"use client";

// Datenschutzerklärung, angepasst auf das, was BrickSpecs technisch wirklich
// macht: Vercel-Hosting + cookielose Web-Analyse, localStorage, Supabase-
// Nutzerkonten, Stripe-Bezahlung, Empfehlungsprogramm, Brevo-Newsletter mit
// Double-Opt-in, Feedback-Formular, Brickognize-Scanner, externe Bild-CDNs,
// Amazon-Affiliate. Bei neuen Datenverarbeitungen ergänzen!

import Link from "next/link";
import { useLang } from "@/lib/i18n";

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-extrabold mt-8 mb-2">{children}</h2>;
}

export default function DatenschutzClient() {
  const { lang } = useLang();
  const de = lang === "de";

  return (
    <div className="mx-auto max-w-3xl px-1 pt-14 pb-20 text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold mb-2">
        {de ? "Datenschutzerklärung" : "Privacy policy"}
      </h1>
      <p className="text-[var(--muted)]">
        {de
          ? "Stand: Juli 2026. Diese Erklärung informiert dich gemäß DSGVO darüber, welche Daten beim Besuch von brickspecs.com verarbeitet werden - und welche bewusst nicht."
          : "Last updated: July 2026. In accordance with the GDPR, this policy explains which data is processed when you visit brickspecs.com - and which deliberately is not."}
      </p>

      <H2>{de ? "1. Verantwortlicher" : "1. Controller"}</H2>
      <p>
        Fuchs Media GmbH
        <br />
        Dornbacher Straße 13a, 2392 Grub, {de ? "Österreich" : "Austria"}
        <br />
        E-Mail:{" "}
        <a className="text-[var(--yellow)] hover:underline" href="mailto:office@fuchsmedia.at">
          office@fuchsmedia.at
        </a>
      </p>

      <H2>{de ? "2. Das Wichtigste vorab" : "2. The short version"}</H2>
      <p>
        {de
          ? "BrickSpecs verwendet keine Tracking-Cookies und keine Werbenetzwerke. Es gibt kein geräteübergreifendes Nutzerprofil und keinen Verkauf von Daten. Zur Reichweitenmessung setzen wir ausschließlich eine cookielose, anonymisierte Aufrufstatistik ein (siehe Punkt 4). Ohne Konto bleiben deine Einstellungen (Sprache, Portfolio, Preisalarme) ausschließlich lokal in deinem Browser."
          : "BrickSpecs uses no tracking cookies and no ad networks. There is no cross-device user profiling and no sale of data. For reach measurement we only use cookieless, anonymised visit statistics (see section 4). Without an account, your settings (language, portfolio, price alerts) stay exclusively in your own browser."}
      </p>

      <H2>{de ? "3. Hosting und Server-Logs (Vercel)" : "3. Hosting and server logs (Vercel)"}</H2>
      <p>
        {de
          ? "Diese Website wird bei Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA) gehostet. Beim Aufruf der Seite verarbeitet Vercel technisch notwendige Verbindungsdaten (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browser-Kennung), um die Website auszuliefern und Angriffe abzuwehren. Rechtsgrundlage ist unser berechtigtes Interesse am sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Vercel ist unter dem EU-US Data Privacy Framework zertifiziert; mit Vercel besteht ein Auftragsverarbeitungsvertrag."
          : "This website is hosted by Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA). When you access the site, Vercel processes technically necessary connection data (IP address, date and time, requested page, browser identifier) to deliver the website and prevent attacks. The legal basis is our legitimate interest in secure operation (Art. 6(1)(f) GDPR). Vercel is certified under the EU-US Data Privacy Framework; a data processing agreement is in place."}
      </p>

      <H2>{de ? "4. Web-Analyse (Vercel Web Analytics)" : "4. Web analytics (Vercel Web Analytics)"}</H2>
      <p>
        {de
          ? "Um zu verstehen, welche Seiten wie oft aufgerufen werden, nutzen wir Vercel Web Analytics. Der Dienst arbeitet cookielos: Es werden keine Cookies gesetzt, keine Kennungen im Browser gespeichert und keine geräteübergreifende Verfolgung durchgeführt. Erfasst wird eine anonymisierte Aufrufstatistik (aufgerufene Seite, Referrer, grobe Geräteklasse, Land); ein Rückschluss auf einzelne Personen ist nicht möglich. Rechtsgrundlage ist unser berechtigtes Interesse an der Analyse und Verbesserung des Angebots (Art. 6 Abs. 1 lit. f DSGVO)."
          : "To understand which pages are visited and how often, we use Vercel Web Analytics. The service is cookieless: no cookies are set, no identifiers are stored in your browser and no cross-device tracking takes place. Only anonymised visit statistics are collected (requested page, referrer, rough device class, country); identifying individual persons is not possible. The legal basis is our legitimate interest in analysing and improving the site (Art. 6(1)(f) GDPR)."}
      </p>

      <H2>{de ? "5. Lokale Speicherung im Browser" : "5. Local storage in your browser"}</H2>
      <p>
        {de
          ? "Funktionen wie Sprachwahl, Portfolio, Preisalarme, Länderauswahl und Plan-Vormerkung speichern ihre Daten im localStorage deines Browsers. Ohne Nutzerkonto verlassen diese Daten dein Gerät nicht und werden nicht an uns übertragen. Du kannst sie jederzeit über die Browser-Einstellungen löschen. Da es sich um technisch erforderliche, rein lokale Speicherung handelt, ist kein Cookie-Banner nötig."
          : "Features like language choice, portfolio, price alerts, country selection and plan preselection store their data in your browser's localStorage. Without a user account this data never leaves your device and is not transmitted to us. You can delete it at any time via your browser settings. As this is technically required, purely local storage, no cookie banner is needed."}
      </p>

      <H2>{de ? "6. Nutzerkonten (Supabase)" : "6. User accounts (Supabase)"}</H2>
      <p>
        {de
          ? "Legst du ein BrickSpecs-Konto an, verarbeiten wir deine E-Mail-Adresse, deinen Passwort-Hash (Passwörter werden nie im Klartext gespeichert) sowie deine Portfolio- und Preisalarm-Daten. Gespeichert werden diese Daten bei unserem Auftragsverarbeiter Supabase auf EU-Servern (Region eu-central-1, Amsterdam/Frankfurt); sie verlassen die EU nicht. Rechtsgrundlage ist die Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO). Auf Anfrage an office@fuchsmedia.at löschen wir dein Konto samt aller zugehörigen Daten."
          : "If you create a BrickSpecs account, we process your e-mail address, your password hash (passwords are never stored in plain text) and your portfolio and price alert data. This data is stored with our processor Supabase on EU servers (region eu-central-1, Amsterdam/Frankfurt); it does not leave the EU. The legal basis is the performance of the user agreement (Art. 6(1)(b) GDPR). On request to office@fuchsmedia.at we delete your account together with all associated data."}
      </p>

      <H2>{de ? "7. Bezahlung (Stripe)" : "7. Payments (Stripe)"}</H2>
      <p>
        {de
          ? "Kostenpflichtige Pläne werden über Stripe Payments Europe Ltd. (1 Grand Canal Street Lower, Dublin, Irland) abgewickelt. Deine Zahlungsdaten (z. B. Kartendaten) gibst du direkt bei Stripe ein - wir erhalten und speichern zu keinem Zeitpunkt Kartendaten, sondern lediglich eine Kunden- und Abo-Referenz, um dein Abo deinem Konto zuzuordnen. Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Für die Zahlungsabwicklung gilt ergänzend die Datenschutzerklärung von Stripe."
          : "Paid plans are processed by Stripe Payments Europe Ltd. (1 Grand Canal Street Lower, Dublin, Ireland). You enter your payment details (e.g. card data) directly with Stripe - we never receive or store card data, only a customer and subscription reference to link your subscription to your account. The legal basis is the performance of the contract (Art. 6(1)(b) GDPR). Stripe's own privacy policy additionally applies to payment processing."}
      </p>

      <H2>{de ? "8. Empfehlungsprogramm" : "8. Referral program"}</H2>
      <p>
        {de
          ? "Angemeldete Nutzer erhalten einen persönlichen Empfehlungslink. Nimmst du am Empfehlungsprogramm teil, verarbeiten wir zur Abwicklung die Zuordnung, wer wen geworben hat (eine Konto-Referenz des Werbers im Profil des Geworbenen), sowie Höhe, Zeitpunkt, Quelle und Status der daraus entstehenden Gutschriften. Diese Daten sind erforderlich, um Provisionen korrekt zu berechnen und auszuzahlen. Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Geworbene sehen zu keinem Zeitpunkt Daten des Werbers und umgekehrt - der Werber sieht nur anonyme Zähler und Beträge."
          : "Registered users receive a personal referral link. If you take part in the referral program, we process the mapping of who referred whom (an account reference of the referrer in the profile of the referred user) as well as the amount, time, source and status of the resulting credits. This data is required to calculate and pay out commissions correctly. The legal basis is the performance of the contract (Art. 6(1)(b) GDPR). Referred users never see any data of the referrer and vice versa - the referrer only sees anonymous counters and amounts."}
      </p>

      <H2>{de ? "9. Newsletter (Brevo)" : "9. Newsletter (Brevo)"}</H2>
      <p>
        {de
          ? "Für den 'BrickSpecs Alarm'-Newsletter (Deals, Gratis-Beigaben, Leaks) verarbeiten wir deine E-Mail-Adresse sowie Zeitpunkt von Anmeldung und Bestätigung. Die Anmeldung erfolgt im Double-Opt-in-Verfahren: Du erhältst erst dann Mails, wenn du den Bestätigungslink angeklickt hast. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO); du kannst sie jederzeit über den Abmeldelink in jeder Mail widerrufen. Versanddienstleister ist die Sendinblue GmbH ('Brevo', Köhlstraße 8, 50827 Köln, Deutschland), mit der ein Auftragsverarbeitungsvertrag besteht. Newsletter-Mails können gekennzeichnete Amazon-Partnerlinks enthalten (siehe Punkt 13)."
          : "For the 'BrickSpecs Alarm' newsletter (deals, gifts with purchase, leaks) we process your e-mail address and the time of sign-up and confirmation. Sign-up uses double opt-in: you only receive mails after clicking the confirmation link. The legal basis is your consent (Art. 6(1)(a) GDPR); you can withdraw it at any time via the unsubscribe link in every mail. Our mailing provider is Sendinblue GmbH ('Brevo', Köhlstraße 8, 50827 Cologne, Germany), with whom a data processing agreement is in place. Newsletter mails may contain labelled Amazon affiliate links (see section 13)."}
      </p>

      <H2>{de ? "10. Feedback-Formular" : "10. Feedback form"}</H2>
      <p>
        {de
          ? "Nutzt du unser Feedback-Formular, verarbeiten wir die von dir gemachten Angaben (Kategorie, Nachricht, optional deine E-Mail-Adresse für Rückfragen sowie die Seite, von der du kamst) ausschließlich zur Bearbeitung deines Anliegens. Der Versand an uns erfolgt über unseren Auftragsverarbeiter Brevo (siehe Punkt 9). Rechtsgrundlage ist unser berechtigtes Interesse an der Bearbeitung von Anfragen und der Verbesserung des Angebots (Art. 6 Abs. 1 lit. f DSGVO). Die Angabe einer E-Mail-Adresse ist freiwillig."
          : "If you use our feedback form, we process the details you provide (category, message, optionally your e-mail address for follow-ups and the page you came from) solely to handle your request. Delivery to us is handled by our processor Brevo (see section 9). The legal basis is our legitimate interest in handling enquiries and improving the site (Art. 6(1)(f) GDPR). Providing an e-mail address is voluntary."}
      </p>

      <H2>{de ? "11. Foto-Scanner (Brickognize)" : "11. Photo scanner (Brickognize)"}</H2>
      <p>
        {de
          ? "Wenn du den Foto-Scanner nutzt, wird dein Foto zur Erkennung an den Dienst Brickognize (api.brickognize.com) übertragen und dort ausschließlich für die Erkennung verarbeitet. Wir speichern deine Fotos zu keinem Zeitpunkt. Die Nutzung des Scanners ist freiwillig; Rechtsgrundlage ist die Erfüllung der von dir angeforderten Funktion (Art. 6 Abs. 1 lit. b DSGVO). Der Box-Code-Scanner läuft dagegen vollständig lokal in deinem Browser - dabei wird nichts übertragen."
          : "When you use the photo scanner, your photo is transmitted to the Brickognize service (api.brickognize.com) and processed there solely for recognition. We never store your photos. Using the scanner is voluntary; the legal basis is the provision of the feature you requested (Art. 6(1)(b) GDPR). The box code scanner, by contrast, runs entirely locally in your browser - nothing is transmitted."}
      </p>

      <H2>{de ? "12. Externe Bild-Quellen" : "12. External image sources"}</H2>
      <p>
        {de
          ? "Set- und Minifiguren-Bilder werden direkt von den Servern von Rebrickable (cdn.rebrickable.com) und teilweise BrickLink geladen. Dabei erhält der jeweilige Anbieter technisch bedingt deine IP-Adresse. Rechtsgrundlage ist unser berechtigtes Interesse an der Darstellung der Katalogbilder ohne eigene Bildspeicherung (Art. 6 Abs. 1 lit. f DSGVO)."
          : "Set and minifigure images are loaded directly from the servers of Rebrickable (cdn.rebrickable.com) and partly BrickLink. For technical reasons, the respective provider receives your IP address. The legal basis is our legitimate interest in displaying catalog images without hosting them ourselves (Art. 6(1)(f) GDPR)."}
      </p>

      <H2>{de ? "13. Affiliate-Links (Amazon PartnerNet)" : "13. Affiliate links (Amazon Associates)"}</H2>
      <p>
        {de
          ? "BrickSpecs ist Teilnehmer des Amazon PartnerNet-Programms. Kauf-Links zu Amazon enthalten eine Partner-Kennung; als Amazon-Partner verdienen wir an qualifizierten Verkäufen, ohne dass sich der Preis für dich ändert. Erst mit dem Klick auf einen solchen Link gelten die Datenschutzbestimmungen von Amazon. Wir erhalten von Amazon keine personenbezogenen Daten über dich."
          : "BrickSpecs participates in the Amazon Associates programme. Buy links to Amazon contain an affiliate tag; as an Amazon Associate we earn from qualifying purchases at no extra cost to you. Amazon's privacy policy applies only once you click such a link. We receive no personal data about you from Amazon."}
      </p>

      <H2>{de ? "14. Externe Kanäle (Telegram, WhatsApp, GitHub)" : "14. External channels (Telegram, WhatsApp, GitHub)"}</H2>
      <p>
        {de
          ? "Unsere Alarm-Kanäle auf Telegram und WhatsApp sowie das öffentliche Code-Repository auf GitHub sind eigenständige Angebote der jeweiligen Plattformen. Wenn du ihnen folgst, gelten deren Datenschutzbestimmungen; eine Anmeldung dort ist für die Nutzung von brickspecs.com nicht erforderlich."
          : "Our alert channels on Telegram and WhatsApp and the public code repository on GitHub are independent offerings of the respective platforms. If you follow them, their privacy policies apply; joining them is not required to use brickspecs.com."}
      </p>

      <H2>{de ? "15. Deine Rechte" : "15. Your rights"}</H2>
      <p>
        {de
          ? "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, eine erteilte Einwilligung jederzeit zu widerrufen. Wende dich dazu formlos an office@fuchsmedia.at. Außerdem kannst du dich bei der österreichischen Datenschutzbehörde beschweren (Barichgasse 40-42, 1030 Wien, www.dsb.gv.at)."
          : "You have the right to access, rectification, erasure, restriction of processing, data portability and objection, and the right to withdraw any consent at any time. Simply contact office@fuchsmedia.at. You may also lodge a complaint with the Austrian Data Protection Authority (Barichgasse 40-42, 1030 Vienna, www.dsb.gv.at)."}
      </p>

      <H2>{de ? "16. Änderungen" : "16. Changes"}</H2>
      <p>
        {de
          ? "Kommen neue Funktionen oder Datenverarbeitungen hinzu, wird diese Erklärung entsprechend aktualisiert. Es gilt die jeweils hier veröffentlichte Fassung."
          : "If new features or data processing activities are added, this policy will be updated accordingly. The version published here applies."}
      </p>

      <p className="mt-10">
        <Link href="/impressum" className="text-[var(--yellow)] hover:underline">
          {de ? "Zum Impressum →" : "Go to the legal notice →"}
        </Link>
      </p>
    </div>
  );
}
