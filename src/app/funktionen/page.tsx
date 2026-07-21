import type { Metadata } from "next";
import FeaturesClient from "./FeaturesClient";

export const metadata: Metadata = {
  title: "Alle Funktionen im Überblick | BrickSpecs",
  description:
    "Was BrickSpecs alles kann: 19.000+ Bau-Sets, 17.000+ Minifiguren, Preise nach Land, EOL-Radar, Foto- und Box-Code-Scanner, Portfolio, Preisalarme, Deals und News.",
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
