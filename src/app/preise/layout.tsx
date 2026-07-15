import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "Preise & Pläne | BrickSpecs",
  description:
    "BrickSpecs-Pläne im Überblick: kostenlos starten, als Sammler oder Investor mehr Limits freischalten - oder mit dem limitierten Founder Brick lebenslang dabei sein.",
};

export default function PreiseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
