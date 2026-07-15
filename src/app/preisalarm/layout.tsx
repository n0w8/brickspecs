import type { Metadata } from "next";

// Private Seite: nicht indexieren (Segment-Layout, rendert nur children).
export const metadata: Metadata = {
  title: "Meine Preisalarme | BrickSpecs",
  robots: { index: false, follow: false },
};

export default function PreisalarmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
