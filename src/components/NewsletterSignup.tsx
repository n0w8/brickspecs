"use client";

import { useState, type FormEvent } from "react";
import { useLang } from "@/lib/i18n";

type Status = "idle" | "loading" | "ok" | "error";

/**
 * E-Mail-Anmeldung fuer den Deal-/GWP-Newsletter (Brevo via /api/newsletter).
 * variant "box"    = eigenstaendige Karte mit Titel und Beschreibung
 * variant "inline" = kompakte einzeilige Form fuer Sektions-Footer
 */
export default function NewsletterSignup({ variant }: { variant: "inline" | "box" }) {
  const { lang } = useLang();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (res.ok && data?.ok) {
        setStatus("ok");
        setMessage(data.message ?? (lang === "de" ? "Eingetragen!" : "Signed up!"));
        setEmail("");
      } else {
        setStatus("error");
        setMessage(
          data?.message ??
            (lang === "de"
              ? "Das hat nicht geklappt - bitte versuch es später noch einmal."
              : "That did not work - please try again later.")
        );
      }
    } catch {
      setStatus("error");
      setMessage(
        lang === "de"
          ? "Netzwerkfehler - bitte versuch es später noch einmal."
          : "Network error - please try again later."
      );
    }
  }

  const finePrint =
    lang === "de"
      ? "Mit dem Eintragen stimmst du E-Mails zu Deals, GWPs und Neuheiten zu. Abmeldung jederzeit. Mails koennen Affiliate-Links enthalten."
      : "By signing up you agree to receive emails about deals, GWPs and new releases. Unsubscribe anytime. Emails may contain affiliate links.";

  const form = (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        type="email"
        required
        maxLength={254}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={lang === "de" ? "deine@email.de" : "you@email.com"}
        aria-label={lang === "de" ? "E-Mail-Adresse" : "Email address"}
        className="input w-full sm:w-64 sm:flex-none"
      />
      <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
        {status === "loading"
          ? lang === "de"
            ? "Sende …"
            : "Sending …"
          : lang === "de"
            ? "Benachrichtigen"
            : "Notify me"}
      </button>
    </form>
  );

  const feedback = message ? (
    <p
      className="text-sm font-semibold"
      style={{ color: status === "ok" ? "#4cd587" : "#ff6b6c" }}
      role="status"
    >
      {message}
    </p>
  ) : null;

  const finePrintEl = <p className="text-xs text-[var(--muted)] leading-relaxed">{finePrint}</p>;

  if (variant === "box") {
    return (
      <div className="card p-6 flex flex-col gap-3">
        <h2 className="text-lg font-bold">
          🔔 {lang === "de" ? "Deal- und GWP-Alarm per E-Mail" : "Deal and GWP alerts by email"}
        </h2>
        <p className="text-sm text-[#c7cede]">
          {lang === "de"
            ? "Wir schicken dir neue LEGO-Deals, Gratis-Beigaben und Leaks direkt ins Postfach - kompakt und meist einmal am Tag."
            : "We send new LEGO deals, gifts with purchase and leaks straight to your inbox - compact and usually once a day."}
        </p>
        {form}
        {feedback}
        {finePrintEl}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {form}
      {feedback}
      {finePrintEl}
    </div>
  );
}
