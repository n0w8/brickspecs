"use client";

/**
 * Unsichtbare Komponente im Root-Layout:
 * - liest beim Laden ?ref=CODE aus der URL und merkt den Code 90 Tage vor
 *   (der eigene Code eines eingeloggten Nutzers wird ignoriert),
 * - ordnet einen vorgemerkten Code still zu, sobald ein Nutzer eingeloggt ist.
 *
 * Der ?ref-Parameter bleibt bewusst in der URL stehen (Canonical-Tags
 * existieren, SEO-seitig unkritisch).
 */

import { useEffect } from "react";
import { getAuthUser, getProfile, onAuthChange } from "@/lib/auth";
import {
  claimPendingReferral,
  normalizeRefCode,
  storeRefCode,
} from "@/lib/referral";
import { supabaseConfigured } from "@/lib/supabase/client";

export default function ReferralCapture() {
  useEffect(() => {
    if (!supabaseConfigured()) return;

    let cancelled = false;

    // 1) ?ref=CODE aus der URL vormerken (window.location statt
    //    useSearchParams: kein Suspense-Zwang, Effekt laeuft nur im Browser).
    const code = normalizeRefCode(
      new URLSearchParams(window.location.search).get("ref")
    );
    if (code) {
      void (async () => {
        const user = await getAuthUser();
        if (cancelled) return;
        if (user?.source === "supabase") {
          const profile = await getProfile();
          if (cancelled) return;
          // Eigener Code? Dann nicht vormerken.
          if (profile?.referralCode?.toLowerCase() === code) return;
        }
        storeRefCode(code);
        // Direkt eingeloggt mit fremdem Code: sofort zuordnen.
        if (user?.source === "supabase") void claimPendingReferral();
      })();
    }

    // 2) Bei jedem Login/Session-Start vorgemerkten Code einloesen -
    //    onAuthChange meldet auch den Initialzustand, dadurch greift der
    //    Claim auch nach dem Registrierungs-Callback (/auth/callback -> /profil).
    const unsubscribe = onAuthChange((user) => {
      if (user?.source === "supabase") void claimPendingReferral();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return null;
}
