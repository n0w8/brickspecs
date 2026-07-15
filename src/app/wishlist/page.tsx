"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/lib/i18n";
import { isAuthenticated } from "@/lib/auth";
import {
  getWishlist,
  onWishlistChange,
  removeFromWishlist,
  type WishlistItem,
} from "@/lib/wishlist";
import BrickImage from "@/components/BrickImage";

export default function WishlistPage() {
  const { lang } = useLang();
  const t = useT();

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

  // Live-Update, falls auf einer Set-Seite etwas hinzugefuegt/entfernt wird.
  useEffect(() => {
    if (!loggedIn) return;
    return onWishlistChange(() => {
      void getWishlist().then(setItems);
    });
  }, [loggedIn]);

  if (!ready) return null;

  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto pt-14 text-center card p-10">
        <p className="text-4xl mb-3">❤️</p>
        <h1 className="text-2xl font-extrabold mb-2">
          {lang === "de" ? "Deine Wunschliste" : "Your wishlist"}
        </h1>
        <p className="mb-5 text-[var(--muted)]">
          {lang === "de"
            ? "Merke dir deine Traumsets und behalte ihre Preise im Blick. Dafür brauchst du nur ein kostenloses Konto."
            : "Save your dream sets and keep an eye on their prices. All you need is a free account."}
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn">
            {t("auth.loginTitle")}
          </Link>
          <Link href="/registrieren" className="btn btn-primary">
            {t("auth.registerTitle")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div>
        <h1 className="text-3xl font-extrabold mb-1">
          ❤️ {lang === "de" ? "Meine Wunschliste" : "My wishlist"}
        </h1>
        <p className="text-[var(--muted)]">
          {lang === "de"
            ? "Deine gemerkten Traumsets - jederzeit den Preis im Blick."
            : "Your saved dream sets - always keep the price in sight."}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)]">
          <p className="text-4xl mb-3">✨</p>
          <p className="mb-5">
            {lang === "de"
              ? "Deine Wunschliste ist noch leer. Öffne ein Set im Lexikon und merke dir dein erstes Traumset."
              : "Your wishlist is empty. Open a set in the encyclopedia and save your first dream set."}
          </p>
          <Link href="/lexikon" className="btn btn-primary">
            {lang === "de" ? "Zum Set-Lexikon" : "Go to encyclopedia"}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="card flex flex-col">
              <Link href={`/lexikon/${item.setId}`}>
                <BrickImage
                  src={item.img}
                  alt={item.name}
                  label={item.setId}
                  className="h-40 w-full"
                  imgClassName="object-contain p-3"
                />
              </Link>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <Link
                  href={`/lexikon/${item.setId}`}
                  className="font-semibold leading-snug hover:text-[var(--yellow)]"
                >
                  {item.name}
                </Link>
                <span className="font-mono text-xs text-[var(--muted)]">{item.setId}</span>
                <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                  <Link
                    href={`/lexikon/${item.setId}`}
                    className="text-sm text-[var(--yellow)] hover:underline"
                  >
                    {lang === "de" ? "Preis ansehen →" : "View price →"}
                  </Link>
                  <button
                    type="button"
                    className="text-xs text-[var(--muted)] hover:text-[#ff6b6c]"
                    onClick={() => {
                      // Optimistisch entfernen, dann persistieren.
                      setItems((prev) => prev.filter((i) => i.id !== item.id));
                      void removeFromWishlist(item.setId);
                    }}
                  >
                    🗑 {lang === "de" ? "Entfernen" : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
