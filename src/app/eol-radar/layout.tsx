import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "EOL-Radar - welche LEGO-Sets bald verschwinden | BrickSpecs",
  description:
    "Welche LEGO-Sets bald aus dem Sortiment fliegen (End of Life) - mit Prognose-Zeitfenster. Kurz vor EOL kaufen, nach EOL profitieren.",
};

export default function EolRadarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
