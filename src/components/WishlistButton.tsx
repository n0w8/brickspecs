"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { isAuthenticated } from "@/lib/auth";
import {
  addToWishlist,
  isInWishlist,
  needsLogin,
  onWishlistChange,
  removeFromWishlist,
} from "@/lib/wishlist";

/**
 * Herz-Toggle fuer Set-Detailseiten. Eingeloggte Nutzer merken sich das Set
 * (optimistisches UI, Zustand via isInWishlist). Ohne echtes Konto fuehrt der
 * Klick auf /registrieren - die Wunschliste ist konto-gebunden.
 */
export default function WishlistButton({
  setId,
  name,
  img,
}: {
  setId: string;
  name: string;
  img?: string;
}) {
  const { lang } = useLang();

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [li, inWl] = await Promise.all([isAuthenticated(), isInWishlist(setId)]);
      if (cancelled) return;
      setLoggedIn(li);
      setSaved(inWl);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [setId]);

  // Live-Update, falls anderswo (z. B. /wishlist) etwas entfernt wurde.
  useEffect(() => {
    return onWishlistChange(() => {
      void isInWishlist(setId).then(setSaved);
    });
  }, [setId]);

  if (!ready) return null;

  // Nicht eingeloggt: einladender Hinweis + Weg zur Registrierung.
  if (!loggedIn) {
    return (
      <section className="card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg">
            ♡ {lang === "de" ? "Wunschliste" : "Wishlist"}
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {lang === "de"
              ? "Merke dir dieses Set und behalte seinen Preis im Blick - dafür brauchst du ein kostenloses Konto."
              : "Save this set and keep an eye on its price - a free account is all you need."}
          </p>
        </div>
        <Link href="/registrieren" className="btn btn-primary shrink-0">
          ♡ {lang === "de" ? "Zur Wunschliste" : "Add to wishlist"}
          <span className="ml-2 badge badge-gray !py-0.5">
            {lang === "de" ? "Konto nötig" : "Account needed"}
          </span>
        </Link>
      </section>
    );
  }

  const toggle = () => {
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistisch
    const action = next
      ? addToWishlist({ setId, name, img })
      : removeFromWishlist(setId);
    void action
      .then((result) => {
        if (needsLogin(result)) {
          // Session zwischenzeitlich verloren: zuruecksetzen.
          setSaved(false);
          setLoggedIn(false);
        }
      })
      .catch(() => {
        setSaved(!next); // Fehler: optimistisches UI zuruecknehmen
      })
      .finally(() => setBusy(false));
  };

  return (
    <section className="card p-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-bold text-lg">
          {saved ? "❤️" : "♡"} {lang === "de" ? "Wunschliste" : "Wishlist"}
        </h2>
        {saved && (
          <Link
            href="/wishlist"
            className="text-sm text-[var(--muted)] hover:text-[var(--yellow)] mt-1 inline-block"
          >
            {lang === "de"
              ? "Auf deiner Wunschliste - alle ansehen →"
              : "On your wishlist - view all →"}
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        className={`btn shrink-0 ${saved ? "" : "btn-primary"}`}
      >
        {saved
          ? `✓ ${lang === "de" ? "Gemerkt" : "Saved"}`
          : `♡ ${lang === "de" ? "Zur Wunschliste" : "Add to wishlist"}`}
      </button>
    </section>
  );
}
