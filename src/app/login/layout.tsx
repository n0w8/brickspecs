import type { Metadata } from "next";

// Metadaten fuer die Client-Seite (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "Anmelden | BrickSpecs",
  description: "Melde dich bei BrickSpecs an und verwalte Portfolio, Preisalarme und dein Profil.",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
