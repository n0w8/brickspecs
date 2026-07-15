import type { Metadata } from "next";

// Private Seite: nicht indexieren (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "Mein Portfolio | BrickSpecs",
  robots: { index: false, follow: false },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
