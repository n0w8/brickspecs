import type { Metadata } from "next";

// Metadaten fuer die Artikel-Liste (die Detailseiten haben eigenes generateMetadata).
export const metadata: Metadata = {
  title: "Artikel & Guides für LEGO-Sammler | BrickSpecs",
  description:
    "Hintergrundwissen für LEGO-Sammler: Vintage, Retro, Investment-Strategien, Echtheits-Checks und mehr.",
};

export default function ArtikelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
