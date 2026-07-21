import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "LEGO Deals & News | BrickSpecs",
  description:
    "Die besten LEGO-Deals, offizielle News und Aktionen aus den großen Quellen - automatisch gesammelt und laufend aktualisiert, an einem Ort.",
};

export default function LeaksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
