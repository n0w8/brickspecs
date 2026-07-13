import type { Metadata } from "next";
import DatenschutzClient from "./DatenschutzClient";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | BrickSpecs",
  description: "Datenschutzerklärung für brickspecs.com: Hosting, lokale Speicherung, Newsletter, Scanner und deine Rechte.",
  robots: { index: false, follow: true },
};

export default function DatenschutzPage() {
  return <DatenschutzClient />;
}
