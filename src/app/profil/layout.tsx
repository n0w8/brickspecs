import type { Metadata } from "next";

// Private Seite: nicht indexieren (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "Mein Profil | BrickSpecs",
  robots: { index: false, follow: false },
};

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
