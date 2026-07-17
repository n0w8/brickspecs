"use client";

/**
 * Unsichtbarer Heartbeat im Root-Layout: meldet die (anonyme) Praesenz dieses
 * Browsers alle 60s an /api/presence, damit "X gerade online" stimmt. Die
 * Session-ID ist eine zufaellige, nur lokal gespeicherte Kennung - keine
 * personenbezogenen Daten.
 */

import { useEffect } from "react";

const SID_KEY = "bricktopia.sid";

function sessionId(): string {
  try {
    let sid = window.localStorage.getItem(SID_KEY);
    if (!sid || !/^[A-Za-z0-9_-]{8,64}$/.test(sid)) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().replace(/-/g, "")
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export default function PresencePinger() {
  useEffect(() => {
    const sid = sessionId();
    let stopped = false;

    const ping = () => {
      if (stopped || document.visibilityState === "hidden") return;
      void fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid }),
        keepalive: true,
      }).catch(() => {});
    };

    ping();
    const timer = window.setInterval(ping, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
