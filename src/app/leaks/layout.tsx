import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "LEGO Leaks & Deals | BrickSpecs",
  description:
    "Frische LEGO-Leaks, Deals und Aktionen aus den großen News-Quellen - automatisch gesammelt und laufend aktualisiert, an einem Ort.",
};

export default function LeaksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
