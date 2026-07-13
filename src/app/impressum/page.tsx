import type { Metadata } from "next";
import ImpressumClient from "./ImpressumClient";

export const metadata: Metadata = {
  title: "Impressum | BrickSpecs",
  description: "Impressum und Offenlegung für brickspecs.com, betrieben von der Fuchs Media GmbH, Österreich.",
  robots: { index: false, follow: true },
};

export default function ImpressumPage() {
  return <ImpressumClient />;
}
