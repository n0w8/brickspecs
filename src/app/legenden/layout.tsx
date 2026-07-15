import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "Legendäre LEGO-Sets - kuratierte Sammler-Steckbriefe | BrickSpecs",
  description:
    "Kuratierte Steckbriefe der wichtigsten Sammler-Sets mit Preishistorie, Wertentwicklung und Investment-Einschätzung.",
};

export default function LegendenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
