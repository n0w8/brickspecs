import type { Metadata } from "next";
import { UPCOMING } from "@/data/upcoming";
import { getCatalogSet } from "@/lib/catalog";
import NeuheitenClient from "./NeuheitenClient";

export const metadata: Metadata = {
  title: "Neuheiten-Radar - angekündigte & geleakte LEGO-Sets | BrickSpecs",
  description:
    "Alle angekündigten und geleakten LEGO-Sets bis Ende 2027: Release-Fenster, erwartete Preise, Teilezahlen und Quellen - laufend gepflegt.",
};

/**
 * Ermittelt serverseitig, welche Neuheiten schon einen echten Katalog-Eintrag
 * haben. Nur diese bekommen einen "Zum Steckbrief"-Link - alle anderen würden
 * auf /lexikon/... eine 404 produzieren.
 */
function buildProfileLinks(): Record<string, string> {
  const links: Record<string, string> = {};
  for (const set of UPCOMING) {
    if (!set.setNumber) continue;
    const entry = getCatalogSet(set.setNumber);
    if (entry) links[set.id] = `/lexikon/${entry.n}`;
  }
  return links;
}

export default function NeuheitenPage() {
  return <NeuheitenClient profileLinks={buildProfileLinks()} />;
}
