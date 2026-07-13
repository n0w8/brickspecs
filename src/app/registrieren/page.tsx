"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LocalizedString } from "@/data/types";
import { pick, useLang, useT } from "@/lib/i18n";
import { signUpWithEmail } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/client";

export default function RegisterPage() {
  const { lang } = useLang();
  const t = useT();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<LocalizedString | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await signUpWithEmail(email.trim(), password, username.trim());
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    if (res.needsConfirmation) {
      setConfirmSent(true);
      return;
    }
    router.push("/profil");
  }

  if (confirmSent) {
    return (
      <div className="max-w-md mx-auto pt-14">
        <div className="card p-8 text-center">
          <p className="text-4xl mb-3">📬</p>
          <h1 className="text-2xl font-extrabold mb-3">{t("auth.confirmTitle")}</h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {t("auth.confirmSent")}{" "}
            <span className="font-semibold text-[var(--text)]">{email}</span>
          </p>
          <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">
            {t("auth.confirmHint")}
          </p>
          <Link href="/login" className="btn btn-primary mt-6 inline-flex">
            {t("auth.loginTitle")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-14">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold mb-6">🧱 {t("auth.registerTitle")}</h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t("auth.username")}
            <input
              className="input"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-[#ff6b6c]">{pick(error, lang)}</p>}
          <button type="submit" className="btn btn-primary mt-2" disabled={busy}>
            {busy ? t("auth.working") : t("auth.submitRegister")}
          </button>
        </form>
        <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">
          {supabaseConfigured() ? t("auth.cloudNote") : t("auth.demoNote")}
        </p>
        <p className="text-sm mt-4">
          <Link href="/login" className="text-[var(--yellow)] hover:underline">
            {t("auth.loginTitle")} →
          </Link>
        </p>
      </div>
    </div>
  );
}
