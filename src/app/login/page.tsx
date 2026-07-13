"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LocalizedString } from "@/data/types";
import { pick, useLang, useT } from "@/lib/i18n";
import { signInWithEmail } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const { lang } = useLang();
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<LocalizedString | null>(null);
  const [callbackError, setCallbackError] = useState(false);

  // Hinweis anzeigen, wenn /auth/callback mit Fehler hierher umgeleitet hat.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fehler") === "bestaetigung") setCallbackError(true);
  }, []);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setCallbackError(false);
    const res = await signInWithEmail(email.trim(), password);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push("/profil");
  }

  return (
    <div className="max-w-md mx-auto pt-14">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold mb-6">👤 {t("auth.loginTitle")}</h1>
        {callbackError && (
          <p className="text-sm text-[#ff6b6c] mb-4">{t("auth.callbackError")}</p>
        )}
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t("auth.email")}
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t("auth.password")}
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-[#ff6b6c]">{pick(error, lang)}</p>}
          <button type="submit" className="btn btn-primary mt-2" disabled={busy}>
            {busy ? t("auth.working") : t("auth.submitLogin")}
          </button>
        </form>
        <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">
          {supabaseConfigured() ? t("auth.cloudNote") : t("auth.demoNote")}
        </p>
        <p className="text-sm mt-4">
          <Link href="/registrieren" className="text-[var(--yellow)] hover:underline">
            {t("auth.registerTitle")} →
          </Link>
        </p>
      </div>
    </div>
  );
}
