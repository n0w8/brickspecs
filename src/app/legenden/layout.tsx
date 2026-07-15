import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "Legendäre LEGO-Sets & Minifiguren - kuratierte Sammler-Steckbriefe | BrickSpecs",
  description:
    "Kuratierte Steckbriefe der wichtigsten Sammler-Sets und der wertvollsten Minifiguren - von Comic-Con-Exclusives bis Chrom-Promos, mit Preishistorie und Wertentwicklung.",
};

export default function LegendenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
