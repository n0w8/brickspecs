"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { buyLinks, COUNTRY_KEY } from "@/lib/buy-links";

/**
 * Auffällige Kauf-Leiste direkt unter dem Set-Kopf: Shop-Chips (Amazon zuerst,
 * Affiliate) für das im PricePanel gewählte Land (localStorage, Default DE).
 * Einzeilig auf Desktop, umbrechend auf Mobile.
 */
export default function BuyLinksBar({ setId }: { setId: string }) {
  const { lang } = useLang();
  const [country, setCountry] = useState("DE");

  useEffect(() => {
    const c = window.localStorage.getItem(COUNTRY_KEY);
    if (c) setCountry(c);
  }, []);

  return (
    <section
      aria-label={lang === "de" ? "Dieses Set kaufen" : "Buy this set"}
      className="card p-4 border-l-4 !border-l-[var(--yellow)]"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-bold text-sm whitespace-nowrap">
          🛒 {lang === "de" ? "Dieses Set kaufen bei:" : "Buy this set at:"}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {buyLinks(setId, country).map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel={link.affiliate ? "noopener noreferrer sponsored" : "noopener noreferrer"}
              className={
                link.affiliate
                  ? "chip font-semibold !border-[var(--yellow)] !text-[var(--yellow)] hover:brightness-110"
                  : "chip hover:!border-[var(--yellow)]"
              }
            >
              {link.label}
              {link.affiliate ? "*" : ""} ↗
            </a>
          ))}
        </div>
        <span className="text-xs text-[var(--muted)] sm:ml-auto whitespace-nowrap">
          {lang === "de" ? "*Affiliate-Links" : "*Affiliate links"}
        </span>
      </div>
    </section>
  );
}
