"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const { lang } = useLang();
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  return (
    <div className="max-w-md mx-auto pt-14">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold mb-6">👤 {t("auth.loginTitle")}</h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (login()) {
              router.push("/profil");
            } else {
              setError(true);
            }
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
          {error && (
            <p className="text-sm text-[#ff6b6c]">
              {lang === "de"
                ? "Kein Konto gefunden - bitte zuerst registrieren."
                : "No account found - please sign up first."}
            </p>
          )}
          <button type="submit" className="btn btn-primary mt-2">
            {t("auth.submitLogin")}
          </button>
        </form>
        <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">{t("auth.demoNote")}</p>
        <p className="text-sm mt-4">
          <Link href="/registrieren" className="text-[var(--yellow)] hover:underline">
            {t("auth.registerTitle")} →
          </Link>
        </p>
      </div>
    </div>
  );
}
