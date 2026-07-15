import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "LEGO Bücher & Merch | BrickSpecs",
  description:
    "Handverlesene Bücher, Spiele, Aufbewahrung und Fan-Artikel rund um LEGO - kuratiert für Sammler.",
};

export default function BuecherMerchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
