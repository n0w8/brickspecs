"use client";

// Feedback-Formular: Kategorie + Nachricht (+ optionale E-Mail), Versand an
// /api/feedback. Enthaelt ein unsichtbares Honeypot-Feld gegen Spam-Bots.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

type Category = "vorschlag" | "fehler" | "datenfehler" | "sonstiges";

const CATEGORIES: { key: Category; emoji: string; de: string; en: string }[] = [
  { key: "vorschlag", emoji: "💡", de: "Vorschlag", en: "Suggestion" },
  { key: "fehler", emoji: "🐛", de: "Fehler", en: "Bug" },
  { key: "datenfehler", emoji: "📊", de: "Datenfehler", en: "Data error" },
  { key: "sonstiges", emoji: "💬", de: "Sonstiges", en: "Other" },
];

export default function FeedbackClient() {
  const { lang } = useLang();
  const de = lang === "de";

  const [category, setCategory] = useState<Category>("vorschlag");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [page, setPage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Von welcher Seite kam der Besucher? (fuer die Mail, rein informativ)
  useEffect(() => {
    setPage(document.referrer || window.location.href);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, message, email, page, website: honeypot }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      setResult(data);
      if (data.ok) {
        setMessage("");
        setEmail("");
      }
    } catch {
      setResult({
        ok: false,
        message: de
          ? "Senden gerade nicht möglich - bitte versuch es später noch einmal."
          : "Sending failed - please try again later.",
      });
    } finally {
      setSending(false);
    }
  }

  const messageLen = message.trim().length;
  const valid = messageLen >= 10 && messageLen <= 2000;

  return (
    <div className="mx-auto max-w-2xl px-1 pt-14 pb-20">
      <h1 className="text-3xl font-extrabold mb-2">
        💬 {de ? "Verbesserungsvorschläge" : "Feedback & suggestions"}
      </h1>
      <p className="text-[var(--muted)] mb-8">
        {de
          ? "Dir fehlt eine Funktion, du hast einen Fehler entdeckt oder ein Preis stimmt nicht? Schreib uns - wir lesen jede Nachricht und bauen BrickSpecs damit Stück für Stück besser."
          : "Missing a feature, found a bug or spotted a wrong price? Write to us - we read every message and use it to make BrickSpecs better, piece by piece."}
      </p>

      <form onSubmit={submit} className="card p-6 flex flex-col gap-5">
        {/* Kategorie */}
        <div>
          <p className="font-semibold mb-2 text-sm">
            {de ? "Worum geht es?" : "What is it about?"}
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`chip ${category === c.key ? "chip-active" : ""}`}
                onClick={() => setCategory(c.key)}
                aria-pressed={category === c.key}
              >
                {c.emoji} {de ? c.de : c.en}
              </button>
            ))}
          </div>
        </div>

        {/* Nachricht */}
        <div>
          <label htmlFor="feedback-message" className="font-semibold mb-2 text-sm block">
            {de ? "Deine Nachricht" : "Your message"}
          </label>
          <textarea
            id="feedback-message"
            className="input min-h-36 resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            required
            placeholder={
              de
                ? "z. B. Beim Set 10188 stimmt der Preis für Österreich nicht …"
                : "e.g. The Austrian price for set 10188 looks wrong …"
            }
          />
          <p className="text-xs text-[var(--muted)] mt-1">
            {messageLen}/2000
            {messageLen > 0 && messageLen < 10 && (
              <span className="text-[var(--yellow)]">
                {" "}
                - {de ? "mindestens 10 Zeichen" : "at least 10 characters"}
              </span>
            )}
          </p>
        </div>

        {/* Optionale E-Mail */}
        <div>
          <label htmlFor="feedback-email" className="font-semibold mb-2 text-sm block">
            {de ? "E-Mail für Rückfragen (optional)" : "Email for follow-ups (optional)"}
          </label>
          <input
            id="feedback-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={de ? "du@beispiel.at" : "you@example.com"}
            autoComplete="email"
          />
        </div>

        {/* Honeypot: fuer Menschen unsichtbar, Bots fuellen es aus */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="feedback-website">Website</label>
          <input
            id="feedback-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {/* Ergebnis */}
        {result && (
          <p
            role="status"
            className={`text-sm font-semibold ${result.ok ? "text-[#4cd587]" : "text-[#ff6b6c]"}`}
          >
            {result.ok ? "✅" : "⚠️"} {result.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={!valid || sending}>
            {sending
              ? de ? "Wird gesendet …" : "Sending …"
              : de ? "Feedback senden" : "Send feedback"}
          </button>
          <span className="text-xs text-[var(--muted)]">
            {de
              ? "Deine Angaben werden nur zur Bearbeitung deines Anliegens verwendet."
              : "Your details are used only to handle your request."}
          </span>
        </div>
      </form>

      <p className="text-sm text-[var(--muted)] mt-6">
        {de ? "Du bist LEGO-Creator oder YouTuber?" : "You are a LEGO creator or YouTuber?"}{" "}
        <Link href="/partner" className="text-[var(--yellow)] hover:underline">
          {de ? "Zum Creator-Programm →" : "Check out the creator program →"}
        </Link>
      </p>
    </div>
  );
}
