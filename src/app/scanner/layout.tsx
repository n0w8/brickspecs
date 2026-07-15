import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "LEGO Foto-Scanner - Set per Foto erkennen | BrickSpecs",
  description:
    "Fotografiere ein LEGO-Set oder eine Minifigur - BrickSpecs erkennt es und öffnet den Steckbrief. Kostenlos im Browser, ohne App.",
};

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
