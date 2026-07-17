"use client";

/**
 * Admin-Sektion "Massen-E-Mail an alle Nutzer" (nur im Admin-Panel).
 * - synchronisiert registrierte Nutzer in die Brevo-Liste,
 * - verschickt eine Kampagne an die Liste.
 * Alle Aufrufe sind serverseitig admin-gepruft (siehe /api/admin/mail/*).
 */

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

interface MailStats {
  listId: number;
  contacts: number | null;
  sender: string;
}

export default function MailBroadcast() {
  const { lang } = useLang();
  const de = lang === "de";

  const [stats, setStats] = useState<MailStats | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"" | "sync" | "send">("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const loadStats = () => {
    fetch("/api/admin/mail")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: MailStats | null) => setStats(j))
      .catch(() => {});
  };
  useEffect(loadStats, []);

  const sync = async () => {
    setBusy("sync");
    setNote(null);
    try {
      const r = await fetch("/api/admin/mail/sync", { method: "POST" });
      const j = await r.json();
      if (r.ok) {
        setNote({ ok: true, text: de ? `${j.synced} Nutzer synchronisiert.` : `${j.synced} users synced.` });
        loadStats();
      } else {
        setNote({ ok: false, text: j.error ?? "Fehler" });
      }
    } catch {
      setNote({ ok: false, text: de ? "Netzwerkfehler" : "Network error" });
    } finally {
      setBusy("");
    }
  };

  const send = async () => {
    if (subject.trim().length < 2 || message.trim().length < 2) {
      setNote({ ok: false, text: de ? "Betreff und Nachricht ausfuellen." : "Fill subject and message." });
      return;
    }
    const count = stats?.contacts ?? 0;
    if (!window.confirm(de ? `Wirklich an ${count} Empfaenger senden?` : `Really send to ${count} recipients?`)) return;
    setBusy("send");
    setNote(null);
    try {
      const r = await fetch("/api/admin/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const j = await r.json();
      if (r.ok) {
        setNote({ ok: true, text: de ? "Kampagne wird versendet ✓" : "Campaign sending ✓" });
        setSubject("");
        setMessage("");
      } else {
        setNote({ ok: false, text: j.error ?? "Fehler" });
      }
    } catch {
      setNote({ ok: false, text: de ? "Netzwerkfehler" : "Network error" });
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="card p-5">
      <h2 className="font-bold text-lg mb-4">
        📧 {de ? "Massen-E-Mail an alle Nutzer" : "Broadcast to all users"}
      </h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2">
          <span className="badge badge-blue">{de ? "In der Liste" : "In list"}</span>
          <span className="font-bold">{stats?.contacts ?? "-"}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm">
          <span className="text-[var(--muted)]">{de ? "Absender" : "Sender"}:</span>
          <span className="font-mono">{stats?.sender ?? "-"}</span>
        </div>
        <button type="button" className="btn" disabled={busy !== ""} onClick={sync}>
          {busy === "sync"
            ? de ? "Synchronisiere ..." : "Syncing ..."
            : de ? "Nutzer synchronisieren" : "Sync users"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <input
          className="input"
          placeholder={de ? "Betreff" : "Subject"}
          value={subject}
          maxLength={200}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          className="input min-h-[140px]"
          placeholder={de ? "Deine Nachricht an alle Nutzer ..." : "Your message to all users ..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" disabled={busy !== ""} onClick={send}>
            {busy === "send"
              ? de ? "Sende ..." : "Sending ..."
              : de ? "An alle senden" : "Send to all"}
          </button>
          {note && (
            <span className={`text-sm ${note.ok ? "text-[#4cd587]" : "text-[#ff6b6c]"}`}>{note.text}</span>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">
        {de
          ? "Hinweis: Werbe-Mails an alle Nutzer brauchen eine rechtliche Grundlage (Einwilligung/berechtigtes Interesse) und einen Abmeldelink (automatisch enthalten). Fuer gute Zustellbarkeit muss die Absender-Domain in Brevo authentifiziert sein (SPF/DKIM) - sonst landen Mails im Spam."
          : "Note: marketing emails to all users need a legal basis (consent/legitimate interest) and an unsubscribe link (included automatically). For good deliverability the sender domain must be authenticated in Brevo (SPF/DKIM) - otherwise mails land in spam."}
      </p>
    </section>
  );
}
