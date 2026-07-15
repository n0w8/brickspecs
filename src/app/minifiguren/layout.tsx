import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "Minifiguren-Datenbank - 17.000+ LEGO-Figuren | BrickSpecs",
  description:
    "Über 17.000 LEGO-Minifiguren mit Bild und Set-Zuordnung: Du siehst zu jeder Figur, in welchen Sets sie steckt - und zu jedem Set seine Figuren.",
};

export default function MinifigurenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
