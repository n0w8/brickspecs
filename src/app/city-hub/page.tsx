"use client";

import Link from "next/link";
import { useState } from "react";
import { CITY_IDEAS } from "@/data/cityhub";
import { pick, useLang, useT } from "@/lib/i18n";

const DIFF_META = {
  easy: { de: "Einsteiger", en: "Beginner", cls: "badge-green" },
  medium: { de: "Fortgeschritten", en: "Intermediate", cls: "badge-yellow" },
  hard: { de: "Profi", en: "Expert", cls: "badge-red" },
} as const;

export default function CityHubPage() {
  const { lang } = useLang();
  const t = useT();
  const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");

  const ideas = CITY_IDEAS.filter((i) => difficulty === "all" || i.difficulty === difficulty);

  return (
    <div className="flex flex-col gap-8 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">🏙️ {t("nav.city")}</h1>
        <p className="text-[var(--muted)] max-w-2xl">
          {lang === "de"
            ? "Ideen, Techniken und Inspiration für deine LEGO-Stadt - von der U-Bahn unter den Straßen bis zur Skyline."
            : "Ideas, techniques and inspiration for your LEGO city - from the subway beneath the streets to the skyline."}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className={`chip ${difficulty === "all" ? "chip-active" : ""}`}
          onClick={() => setDifficulty("all")}
        >
          {t("common.all")}
        </button>
        {(["easy", "medium", "hard"] as const).map((d) => (
          <button
            key={d}
            className={`chip ${difficulty === d ? "chip-active" : ""}`}
            onClick={() => setDifficulty(d)}
          >
            {DIFF_META[d][lang]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((idea) => {
          const diff = DIFF_META[idea.difficulty];
          return (
            <article key={idea.id} className="card card-hover p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl" aria-hidden>
                  {idea.emoji}
                </span>
                <span className={`badge ${diff.cls}`}>{diff[lang]}</span>
              </div>
              <h2 className="font-bold text-lg leading-snug">{pick(idea.title, lang)}</h2>
              <p className="text-sm text-[#c7cede] leading-relaxed">
                {pick(idea.description, lang)}
              </p>
              <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
                {idea.tags.map((tag) => (
                  <span key={tag} className="badge badge-gray">
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
