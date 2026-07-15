"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SETS } from "@/data/sets";
import { pick, useLang } from "@/lib/i18n";
import { isAuthenticated } from "@/lib/auth";
import { getWishlist, onWishlistChange, type WishlistItem } from "@/lib/wishlist";
import BrickImage from "./BrickImage";

/**
 * Einladende Wunschlisten-Sektion fuer die Startseite.
 * - Gaeste: huebsche Teaser-Karte mit Beispiel-Optik + CTA "Kostenlos registrieren".
 * - Eingeloggt: Vorschau der eigenen Wunschliste (erste Sets + Link zu /wishlist)
 *   bzw. bei leerer Liste ein freundlicher Hinweis.
 * Dezent gehalten und mobiltauglich.
 */

// Beispiel-Sets fuer die Gaeste-Optik: wertvollste eingestellte Sets.
const SAMPLE = [...SETS]
  .filter((s) => s.availability === "retired")
  .sort((a, b) => (b.currentValueNewEUR ?? 0) - (a.currentValueNewEUR ?? 0))
  .slice(0, 4);

export default function HomeWishlist() {
  const { lang } = useLang();

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const li = await isAuthenticated();
      if (cancelled) return;
      setLoggedIn(li);
      if (li) {
        const wl = await getWishlist();
        if (cancelled) return;
        setItems(wl);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    return onWishlistChange(() => {
      void getWishlist().then(setItems);
    });
  }, [loggedIn]);

  if (!ready) return null;

  /* ---------- Eingeloggt: eigene Wunschliste ---------- */
  if (loggedIn) {
    const preview = items.slice(0, 4);
    return (
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold">
            ❤️ {lang === "de" ? "Deine Wunschliste" : "Your wishlist"}
          </h2>
          <Link href="/wishlist" className="text-sm text-[var(--yellow)] hover:underline">
            {lang === "de" ? "Alle ansehen →" : "View all →"}
          </Link>
        </div>

        {preview.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[var(--muted)]">
              {lang === "de"
                ? "Noch nichts gemerkt - öffne ein Set und merke dir dein erstes Traumset."
                : "Nothing saved yet - open a set and save your first dream set."}
            </p>
            <Link href="/lexikon" className="btn btn-primary shrink-0">
              {lang === "de" ? "Set-Lexikon öffnen" : "Open encyclopedia"}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {preview.map((item) => (
              <Link
                key={item.id}
                href={`/lexikon/${item.setId}`}
                className="card card-hover flex flex-col"
              >
                <BrickImage
                  src={item.img}
                  alt={item.name}
                  label={item.setId}
                  className="h-28 w-full"
                  imgClassName="object-contain p-2"
                />
                <div className="p-3">
                  <p className="text-sm font-semibold leading-snug line-clamp-2">{item.name}</p>
                  <span className="font-mono text-xs text-[var(--muted)]">{item.setId}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    );
  }

  /* ---------- Gaeste: einladender Teaser ---------- */
  return (
    <section className="card p-6 sm:p-8 grid gap-6 lg:grid-cols-2 items-center">
      <div className="flex flex-col gap-4">
        <span className="badge badge-red w-fit">
          ❤️ {lang === "de" ? "Wunschliste" : "Wishlist"}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
          {lang === "de"
            ? "Erstelle deine Wunschliste"
            : "Create your wishlist"}
        </h2>
        <p className="text-[var(--muted)] text-lg">
          {lang === "de"
            ? "Merke dir deine Traumsets und behalte ihre Preise im Blick. Kostenlos, in deinem persönlichen Konto gespeichert - auf allen Geräten."
            : "Save your dream sets and keep an eye on their prices. Free, stored in your personal account - on every device."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/registrieren" className="btn btn-primary">
            ♡ {lang === "de" ? "Kostenlos registrieren" : "Sign up free"}
          </Link>
          <Link href="/login" className="btn">
            {lang === "de" ? "Anmelden" : "Log in"}
          </Link>
        </div>
      </div>

      {/* Beispiel-Optik: echte Sets mit Herz-Overlay */}
      <div className="grid gap-3 grid-cols-2">
        {SAMPLE.map((set) => (
          <div key={set.id} className="card relative overflow-hidden">
            <span className="absolute top-2 right-2 text-lg z-10" aria-hidden>
              ❤️
            </span>
            <BrickImage
              src={set.imageUrl}
              alt={pick(set.name, lang)}
              label={set.id}
              className="h-24 w-full"
              imgClassName="object-contain p-2"
            />
            <div className="px-3 py-2">
              <p className="text-xs font-semibold leading-snug line-clamp-1">
                {pick(set.name, lang)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
