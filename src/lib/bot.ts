/**
 * Erkennt Crawler, die JavaScript ausfuehren (Googlebot, Bingbot, Ahrefs ...).
 * Fuer sie lohnen sich Praesenz-Ping, Aufruf-Zaehler und Preisabruf nicht:
 * jeder dieser Aufrufe kostet Serverzeit auf Vercel, und bei zehntausenden
 * Katalogseiten summiert sich das (Sept. 2026: 75 % des Gratis-Kontingents,
 * bei nur ~40 echten Besuchern). Echte Menschen bleiben unberuehrt.
 *
 * Bewusst NICHT enthalten: "pinterest" und "fban/fbav" - das sind In-App-Browser
 * echter Besucher, die ueber Pins und Facebook-Posts kommen.
 */
export function istBot(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent || "";
  if ((navigator as { webdriver?: boolean }).webdriver === true) return true;
  return /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pagespeed|facebookexternalhit|petalbot|yandex|duckduckbot|applebot|semrush|ahrefs|mj12|dotbot|bytespider|gptbot|claudebot|ccbot/i.test(
    ua
  );
}
