"use client";

// Creator-Programm: Pitch fuer LEGO-YouTuber und -Creator.
// Partner-Sektion wird datengetrieben aus src/data/partners.ts gerendert.

import Link from "next/link";
import { pick, useLang } from "@/lib/i18n";
import { PARTNERS } from "@/data/partners";

const CONTACT_MAILTO =
  "mailto:office@fuchsmedia.at?subject=BrickSpecs%20Creator-Programm";

export default function PartnerClient() {
  const { lang } = useLang();
  const de = lang === "de";

  const perks: { emoji: string; title: string; desc: string }[] = de
    ? [
        {
          emoji: "💎",
          title: "Investor-Lifetime-Zugang gratis",
          desc: "Du bekommst den höchsten BrickSpecs-Plan dauerhaft kostenlos - alle Preisdaten, Alarme und Portfolio-Funktionen ohne Limit, solange du dabei bist.",
        },
        {
          emoji: "🔗",
          title: "Eigener Empfehlungslink",
          desc: "Dein persönlicher Link mit Umsatzbeteiligung: bis zu 30% wiederkehrend an jedem Abo, das über dich zustande kommt - Programm startet in Kürze.",
        },
        {
          emoji: "⭐",
          title: "Vorstellung auf der Partner-Seite",
          desc: "Wir stellen deinen Kanal hier auf BrickSpecs vor - mit Link, Logo und Kurzbeschreibung. Als Gegenleistung reicht ein Video oder eine Erwähnung.",
        },
      ]
    : [
        {
          emoji: "💎",
          title: "Free Investor lifetime access",
          desc: "You get the highest BrickSpecs plan permanently for free - all price data, alerts and portfolio features without limits, for as long as you are on board.",
        },
        {
          emoji: "🔗",
          title: "Your own referral link",
          desc: "Your personal link with revenue share: up to 30% recurring on every subscription you bring in - program launching soon.",
        },
        {
          emoji: "⭐",
          title: "Featured on the partner page",
          desc: "We feature your channel right here on BrickSpecs - with link, logo and short bio. In return, a video or a mention is all it takes.",
        },
      ];

  const steps: { title: string; desc: string }[] = de
    ? [
        {
          title: "Melde dich per Mail",
          desc: "Schreib uns kurz, wer du bist und wo dein Kanal zu finden ist.",
        },
        {
          title: "Zugang + Link erhalten",
          desc: "Wir schalten deinen Investor-Zugang frei und richten deinen Empfehlungslink ein.",
        },
        {
          title: "Video oder Erwähnung",
          desc: "Du stellst BrickSpecs in einem Video oder einer Erwähnung vor - fertig.",
        },
      ]
    : [
        {
          title: "Reach out by mail",
          desc: "Tell us briefly who you are and where to find your channel.",
        },
        {
          title: "Get access + link",
          desc: "We unlock your Investor access and set up your referral link.",
        },
        {
          title: "Video or mention",
          desc: "You introduce BrickSpecs in a video or a mention - done.",
        },
      ];

  return (
    <div className="mx-auto max-w-4xl px-1 pt-14 pb-20">
      {/* Pitch */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
          🎬 {de ? "Creator-Programm" : "Creator program"}
        </h1>
        <p className="text-[var(--muted)] max-w-2xl mx-auto">
          {de
            ? "Du machst YouTube-Videos, Reels oder Streams über LEGO? Dann lass uns zusammenarbeiten: Du zeigst deiner Community BrickSpecs, wir geben dir dafür den vollen Zugang und beteiligen dich am Umsatz."
            : "You make YouTube videos, reels or streams about LEGO? Let's team up: you show BrickSpecs to your community, we give you full access and a share of the revenue."}
        </p>
      </div>

      {/* Vorteile */}
      <div className="grid gap-4 sm:grid-cols-3 mb-12">
        {perks.map((perk) => (
          <div key={perk.title} className="card p-5">
            <span className="text-3xl block mb-2" aria-hidden>
              {perk.emoji}
            </span>
            <p className="font-bold mb-1.5">{perk.title}</p>
            <p className="text-sm text-[var(--muted)] leading-relaxed">{perk.desc}</p>
          </div>
        ))}
      </div>

      {/* Ablauf in 3 Schritten */}
      <section className="mb-12">
        <h2 className="text-xl font-extrabold mb-4">
          {de ? "So läuft es ab" : "How it works"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="card p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--yellow)] text-[#16130a] font-extrabold mb-3">
                {i + 1}
              </span>
              <p className="font-bold mb-1.5">{step.title}</p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kontakt-CTA */}
      <div className="card p-6 text-center mb-12 border-l-4 !border-l-[var(--yellow)]">
        <p className="font-bold text-lg mb-2">
          {de ? "Klingt gut? Dann melde dich!" : "Sounds good? Get in touch!"}
        </p>
        <p className="text-sm text-[var(--muted)] mb-4 max-w-xl mx-auto">
          {de
            ? "Eine formlose Mail genügt - Kanalname und Link reichen uns für den Anfang."
            : "An informal mail is enough - channel name and link are all we need to get started."}
        </p>
        <a href={CONTACT_MAILTO} className="btn btn-primary">
          ✉️ office@fuchsmedia.at
        </a>
        <p className="text-xs text-[var(--muted)] mt-4">
          {de ? "Lieber ohne Mail? Nutz einfach unser " : "Prefer no mail? Just use our "}
          <Link href="/feedback" className="text-[var(--yellow)] hover:underline">
            {de ? "Feedback-Formular" : "feedback form"}
          </Link>
          .
        </p>
      </div>

      {/* Unsere Partner (nur wenn Eintraege existieren) */}
      {PARTNERS.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold mb-4">
            {de ? "Unsere Partner" : "Our partners"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PARTNERS.map((partner) => (
              <a
                key={partner.channelUrl}
                href={partner.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-hover p-5 flex gap-4 items-start"
              >
                {partner.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.avatarUrl}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xl"
                    aria-hidden
                  >
                    🎬
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-bold">{partner.name}</p>
                  <p className="text-xs text-[var(--muted)] mb-1.5">{partner.platform}</p>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {pick(partner.blurb, lang)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
