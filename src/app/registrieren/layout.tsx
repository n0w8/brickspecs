import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "Kostenlos registrieren | BrickSpecs",
  description:
    "Erstelle dein kostenloses BrickSpecs-Konto: Portfolio anlegen, Preisalarme setzen und den kompletten Katalog nutzen.",
};

export default function RegistrierenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
