import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "City-Hub - Inspiration für deine LEGO-Stadt | BrickSpecs",
  description:
    "Inspiration und Ideen für den Bau deiner eigenen LEGO-Stadt: Layouts, Module und Bau-Ideen für jedes Budget.",
};

export default function CityHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
