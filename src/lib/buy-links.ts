// Länderabhängige Kauf-Links zu Shops (geteilt von PricePanel und BuyLinksBar).

import { withAmazonTag } from "./config";

/** localStorage-Key für das gewählte Land (gemeinsam mit PricePanel). */
export const COUNTRY_KEY = "bricktopia.country";

/* Länderabhängige Shop-Links (Suche/Katalogseite beim Händler) */
const LEGO_LOCALE: Record<string, string> = {
  DE: "de-de", AT: "de-at", CH: "de-ch", US: "en-us", GB: "en-gb",
  FR: "fr-fr", NL: "nl-nl", IT: "it-it", ES: "es-es", PL: "pl-pl",
};
const AMAZON_TLD: Record<string, string> = {
  DE: "de", AT: "de", CH: "de", US: "com", GB: "co.uk",
  FR: "fr", NL: "nl", IT: "it", ES: "es", PL: "pl",
};
const EBAY_TLD: Record<string, string> = {
  DE: "de", AT: "at", CH: "ch", US: "com", GB: "co.uk",
  FR: "fr", NL: "nl", IT: "it", ES: "es", PL: "pl",
};

export interface BuyLink {
  label: string;
  href: string;
  /** true = Link enthält einen Affiliate-Tag (Kennzeichnungspflicht) */
  affiliate?: boolean;
}

/**
 * Kauf-Links für ein Set im gewählten Land.
 * Amazon steht bewusst an erster Stelle (Affiliate-Link).
 */
export function buyLinks(setId: string, country: string): BuyLink[] {
  const base = setId.replace(/-\d+$/, "");
  const q = encodeURIComponent(`LEGO ${base}`);
  const blId = setId.includes("-") ? setId : `${setId}-1`;
  const links: BuyLink[] = [
    {
      label: "Amazon",
      href: withAmazonTag(`https://www.amazon.${AMAZON_TLD[country] ?? "de"}/s?k=${q}`),
      affiliate: true,
    },
    {
      label: "LEGO.com",
      href: `https://www.lego.com/${LEGO_LOCALE[country] ?? "de-de"}/search?q=${base}`,
    },
    {
      label: "eBay",
      href: `https://www.ebay.${EBAY_TLD[country] ?? "de"}/sch/i.html?_nkw=${q}`,
    },
    {
      label: "BrickLink",
      href: `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${encodeURIComponent(blId)}`,
    },
  ];
  if (country === "DE" || country === "AT") {
    links.push({
      label: "idealo",
      href: `https://www.idealo.${country === "AT" ? "at" : "de"}/preisvergleich/MainSearchProductCategory.html?q=${q}`,
    });
  }
  return links;
}
