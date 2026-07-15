import type { Metadata } from "next";

// Private Seite: nicht indexieren (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "Meine Wunschliste | BrickSpecs",
  robots: { index: false, follow: false },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
