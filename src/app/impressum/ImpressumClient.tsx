"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-extrabold mt-8 mb-2">{children}</h2>;
}

export default function ImpressumClient() {
  const { lang } = useLang();

  return (
    <div className="mx-auto max-w-3xl px-1 pt-14 pb-20 text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold mb-2">
        {lang === "de" ? "Impressum" : "Legal notice"}
      </h1>
      <p className="text-[var(--muted)]">
        {lang === "de"
          ? "Offenlegung gemäß § 5 ECG, § 14 UGB, § 63 GewO und § 25 Mediengesetz."
          : "Information pursuant to § 5 ECG, § 14 UGB, § 63 GewO and § 25 of the Austrian Media Act."}
      </p>

      <H2>{lang === "de" ? "Medieninhaber und Diensteanbieter" : "Media owner and service provider"}</H2>
      <p>
        <strong>Fuchs Media GmbH</strong>
        <br />
        Dornbacher Straße 13a
        <br />
        2392 Grub
        <br />
        {lang === "de" ? "Österreich" : "Austria"}
      </p>

      <H2>{lang === "de" ? "Kontakt" : "Contact"}</H2>
      <p>
        E-Mail:{" "}
        <a className="text-[var(--yellow)] hover:underline" href="mailto:office@fuchsmedia.at">
          office@fuchsmedia.at
        </a>
      </p>

      <H2>{lang === "de" ? "Unternehmensdaten" : "Company details"}</H2>
      <p>
        {lang === "de" ? "Rechtsform" : "Legal form"}: Gesellschaft mit beschränkter Haftung (GmbH)
        <br />
        {lang === "de" ? "Sitz: politische Gemeinde Wienerwald" : "Registered office: municipality of Wienerwald"}
        <br />
        {lang === "de" ? "Firmenbuchnummer" : "Company register number"}: FN 665604 f
        <br />
        {lang === "de" ? "Firmenbuchgericht" : "Register court"}: {lang === "de" ? "Landesgericht Wiener Neustadt" : "Regional Court Wiener Neustadt"}
        <br />
        {lang === "de" ? "UID-Nummer" : "VAT ID"}: ATU82966248
        <br />
        {lang === "de" ? "Unternehmensgegenstand: Medien / Content-Produktion" : "Object of the company: media / content production"}
      </p>

      <H2>{lang === "de" ? "Vertretungsbefugter Geschäftsführer" : "Authorised managing director"}</H2>
      <p>Michael Fuchs</p>

      <H2>{lang === "de" ? "Kammerzugehörigkeit und Berufsrecht" : "Chamber membership and professional law"}</H2>
      <p>
        {lang === "de" ? (
          <>
            Mitglied der Wirtschaftskammer Niederösterreich (
            <a className="text-[var(--yellow)] hover:underline" href="https://www.wko.at" target="_blank" rel="noopener noreferrer">
              www.wko.at
            </a>
            ).
            <br />
            Anwendbare Rechtsvorschrift: Gewerbeordnung (GewO), abrufbar unter{" "}
            <a className="text-[var(--yellow)] hover:underline" href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer">
              www.ris.bka.gv.at
            </a>
            .
            <br />
            Verleihung des Gewerbes: Österreich. Gewerbebehörde: Bezirkshauptmannschaft Mödling.
          </>
        ) : (
          <>
            Member of the Austrian Economic Chamber, Lower Austria (
            <a className="text-[var(--yellow)] hover:underline" href="https://www.wko.at" target="_blank" rel="noopener noreferrer">
              www.wko.at
            </a>
            ).
            <br />
            Applicable trade regulation: Gewerbeordnung (GewO), available at{" "}
            <a className="text-[var(--yellow)] hover:underline" href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer">
              www.ris.bka.gv.at
            </a>
            .
            <br />
            Country of licence: Austria. Supervisory authority: District Administration Mödling.
          </>
        )}
      </p>

      <H2>{lang === "de" ? "Verbraucherstreitbeilegung" : "Consumer dispute resolution"}</H2>
      <p>
        {lang === "de"
          ? "Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
          : "We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board."}
      </p>

      <H2>{lang === "de" ? "Blattlinie" : "Editorial focus"}</H2>
      <p>
        {lang === "de"
          ? "Diese Website informiert über LEGO-Sets, Minifiguren, Marktpreise, Neuheiten und Angebote und richtet sich an Sammler und Fans."
          : "This website provides information about LEGO sets, minifigures, market prices, new releases and offers for collectors and fans."}
      </p>

      <H2>{lang === "de" ? "Markenhinweis" : "Trademark notice"}</H2>
      <p>
        {lang === "de"
          ? "LEGO® ist eine Marke der LEGO Gruppe. Diese Website ist ein unabhängiges Fan-Projekt und steht in keiner Verbindung zur LEGO Gruppe; sie wird von ihr weder gesponsert noch autorisiert oder unterstützt."
          : "LEGO® is a trademark of the LEGO Group. This website is an independent fan project and is not affiliated with, sponsored, authorised or endorsed by the LEGO Group."}
      </p>

      <H2>{lang === "de" ? "Haftung für Inhalte und Links" : "Liability for content and links"}</H2>
      <p>
        {lang === "de"
          ? "Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität - insbesondere von Preisangaben und EOL-Prognosen - kann keine Gewähr übernommen werden; alle Angaben sind keine Anlageberatung. Für die Inhalte verlinkter externer Seiten ist stets der jeweilige Anbieter verantwortlich."
          : "The content of this website was created with the greatest possible care. We assume no liability for its accuracy, completeness or timeliness - especially of price data and EOL forecasts; nothing on this site is financial advice. The respective provider is always responsible for the content of linked external sites."}
      </p>

      <H2>{lang === "de" ? "Urheberrecht" : "Copyright"}</H2>
      <p>
        {lang === "de"
          ? "Die auf dieser Website veröffentlichten Inhalte unterliegen dem österreichischen Urheberrecht. Katalogdaten und Produktbilder stammen aus öffentlichen Quellen (u. a. Rebrickable) und sind als solche gekennzeichnet bzw. verlinkt."
          : "The content published on this website is subject to Austrian copyright law. Catalog data and product images come from public sources (including Rebrickable) and are marked or linked as such."}
      </p>

      <p className="mt-10">
        <Link href="/datenschutz" className="text-[var(--yellow)] hover:underline">
          {lang === "de" ? "Zur Datenschutzerklärung →" : "Go to the privacy policy →"}
        </Link>
      </p>
    </div>
  );
}
