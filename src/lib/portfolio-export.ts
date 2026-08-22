/**
 * Export-Helfer fuer das Portfolio (client-safe, keine Server-Imports).
 *
 * Formate wie bei Brickset:
 * - BrickLink Wanted-List-XML (Wanted List Upload)
 * - Rebrickable-Setlisten-CSV (Import Set List)
 * - vollstaendiges CSV mit allen Feldern (RFC 4180)
 */

import type { PortfolioItem } from "./portfolio";

/**
 * BrickLink/Rebrickable erwarten Set-Nummern im "-N"-Format (z. B. "10188-1").
 * Fehlt das Suffix, wird "-1" angehaengt.
 */
export function normalizeSetNum(setId: string): string {
  const id = setId.trim();
  return /-\d+$/.test(id) ? id : `${id}-1`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC-4180-Quoting: Quotes verdoppeln, Felder mit Komma/Quote/Umbruch einschliessen. */
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function safeQuantity(quantity: number): number {
  return Math.max(1, Math.round(Number(quantity) || 1));
}

/**
 * Portfolio-Condition -> BrickLink-Condition.
 * Im Bestand gibt es nur "new" | "used"; unbekannte Werte werden defensiv
 * gemappt (neuwertig/versiegelt -> N, alles andere -> U).
 */
function toBrickLinkCondition(condition: string): "N" | "U" {
  const c = condition.toLowerCase();
  return c === "new" || c === "sealed" || c === "misb" ? "N" : "U";
}

/** BrickLink-Wanted-List-XML (Item-Typ S = Set). */
export function buildBrickLinkXml(items: PortfolioItem[]): string {
  const rows = items.map((item) =>
    [
      "  <ITEM>",
      "    <ITEMTYPE>S</ITEMTYPE>",
      `    <ITEMID>${escapeXml(normalizeSetNum(item.setId))}</ITEMID>`,
      `    <MINQTY>${safeQuantity(item.quantity)}</MINQTY>`,
      `    <CONDITION>${toBrickLinkCondition(item.condition)}</CONDITION>`,
      "  </ITEM>",
    ].join("\n")
  );
  return ["<INVENTORY>", ...rows, "</INVENTORY>", ""].join("\n");
}

/** Rebrickable-Setlisten-CSV (Header exakt "set_num,quantity"). */
export function buildRebrickableCsv(items: PortfolioItem[]): string {
  const lines = ["set_num,quantity"];
  for (const item of items) {
    lines.push(`${csvField(normalizeSetNum(item.setId))},${safeQuantity(item.quantity)}`);
  }
  return lines.join("\r\n") + "\r\n";
}

/** Vollstaendiges CSV mit allen Portfolio-Feldern. */
export function buildFullCsv(items: PortfolioItem[]): string {
  const lines = ["set_number,name,quantity,condition,purchase_price_eur,added_at,note"];
  for (const item of items) {
    lines.push(
      [
        csvField(item.setId),
        csvField(item.name),
        String(safeQuantity(item.quantity)),
        csvField(item.condition),
        item.purchasePriceEUR !== null && Number.isFinite(item.purchasePriceEUR)
          ? String(item.purchasePriceEUR)
          : "",
        csvField(item.addedAt),
        csvField(item.note ?? ""),
      ].join(",")
    );
  }
  return lines.join("\r\n") + "\r\n";
}

/** Startet einen Browser-Download fuer Textinhalte (Blob + a[download]). */
export function downloadTextFile(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
