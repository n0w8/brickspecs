// Öffentliche Konfiguration (Client-tauglich).

/**
 * WhatsApp-Kanal-Link (https://whatsapp.com/channel/…).
 * Kanal in der WhatsApp-App erstellen (Aktuelles → + → Neuer Kanal),
 * dann den Link in .env.local als NEXT_PUBLIC_WHATSAPP_CHANNEL_URL eintragen.
 */
export const WHATSAPP_CHANNEL_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ??
  "https://whatsapp.com/channel/0029VbDHqsvGk1G1f1jn3D11";

/** Telegram-Kanal (öffentlich). */
export const TELEGRAM_CHANNEL_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL ?? "https://t.me/brickspecs";

/**
 * Amazon-PartnerNet-Tag. Wird an alle Amazon-Kauflinks gehängt;
 * über NEXT_PUBLIC_AMAZON_TAG übersteuerbar.
 */
export const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? "fuchsmedia-21";

/** Hängt den Affiliate-Tag an eine Amazon-URL (andere URLs unverändert). */
export function withAmazonTag(url: string): string {
  if (!AMAZON_TAG || !/amazon\./i.test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}tag=${AMAZON_TAG}`;
}

/** Homepage bekannter Leak-/News-Quellen für Quell-Links im Feed. */
export const SOURCE_URLS: Record<string, string> = {
  StoneWars: "https://www.stonewars.de",
  Promobricks: "https://promobricks.de",
  "Brick Fanatics": "https://www.brickfanatics.com",
  "Jay's Brick Blog": "https://jaysbrickblog.com",
  zusammengebaut: "https://zusammengebaut.com",
  Brickset: "https://brickset.com",
};

/** Baut einen Shop-Such-Link für einen Deal, wenn kein direkter dealUrl vorliegt. */
export function dealSearchUrl(shop: string | undefined, setId: string | undefined): string | null {
  if (!shop) return null;
  const q = setId ? `LEGO ${setId.replace(/-\d+$/, "")}` : "LEGO";
  const enc = encodeURIComponent(q);
  switch (shop.toLowerCase()) {
    case "amazon":
      return withAmazonTag(`https://www.amazon.de/s?k=${enc}`);
    case "alternate":
      return `https://www.alternate.de/listing.xhtml?q=${enc}`;
    case "smyths":
    case "smyths toys":
      return `https://www.smythstoys.com/de/de-de/search/?text=${enc}`;
    case "mediamarkt":
      return `https://www.mediamarkt.de/de/search.html?query=${enc}`;
    case "lego":
    case "lego.com":
      return `https://www.lego.com/de-de/search?q=${enc}`;
    default:
      return `https://www.google.com/search?tbm=shop&q=${enc}`;
  }
}
