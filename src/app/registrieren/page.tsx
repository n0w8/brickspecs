"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="max-w-md mx-auto pt-14">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold mb-6">🧱 {t("auth.registerTitle")}</h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            register({
              username,
              email,
              createdAt: new Date().toISOString(),
            });
            router.push("/profil");
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
          <button type="submit" className="btn btn-primary mt-2">
            {t("auth.submitRegister")}
          </button>
        </form>
        <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">{t("auth.demoNote")}</p>
        <p className="text-sm mt-4">
          <Link href="/login" className="text-[var(--yellow)] hover:underline">
            {t("auth.loginTitle")} →
          </Link>
        </p>
      </div>
    </div>
  );
}
