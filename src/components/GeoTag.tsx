"use client";

/**
 * Unsichtbare Komponente im Root-Layout: schickt EINMAL pro Browser (Marker
 * in localStorage) einen POST an /api/geo, sobald ein Supabase-Nutzer
 * eingeloggt ist. Der Server liest daraus nur den Vercel-Geo-Header
 * (2-Buchstaben-Laendercode) fuer die USt/OSS-Uebersicht - der Client
 * sendet keinerlei Daten, keine IP-Speicherung. Fehler sind bewusst still.
 */

import { useEffect } from "react";
import { onAuthChange } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/client";

const GEO_KEY = "bricktopia.geo-tagged";

export default function GeoTag() {
  useEffect(() => {
    if (!supabaseConfigured()) return;

    let inFlight = false;

    const unsubscribe = onAuthChange((user) => {
      if (!user || user.source !== "supabase" || inFlight) return;
      try {
        if (window.localStorage.getItem(GEO_KEY) === "1") return;
      } catch {
        // localStorage gesperrt -> lieber gar nicht senden als mehrfach.
        return;
      }
      inFlight = true;
      void fetch("/api/geo", { method: "POST", keepalive: true })
        .then(async (res) => {
          // Marker nur setzen, wenn das Land wirklich gespeichert wurde
          // (tagged) - sonst beim naechsten Seitenaufruf erneut versuchen.
          const json = res.ok ? await res.json().catch(() => null) : null;
          if (json && json.tagged === true) {
            try {
              window.localStorage.setItem(GEO_KEY, "1");
            } catch {
              // Marker nicht speicherbar - naechster Versuch beim Neuladen.
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          inFlight = false;
        });
    });

    return unsubscribe;
  }, []);

  return null;
}
