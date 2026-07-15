import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "LEGO-Jahrgänge - alle Sets nach Erscheinungsjahr | BrickSpecs",
  description:
    "Alle LEGO-Bau-Sets nach Erscheinungsjahr - von 1949 bis zu den angekündigten Neuheiten der Zukunft.",
};

export default function JahrgaengeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
