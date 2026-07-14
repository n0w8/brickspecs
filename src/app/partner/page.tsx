import type { Metadata } from "next";
import PartnerClient from "./PartnerClient";

export const metadata: Metadata = {
  title: "Creator-Programm für LEGO-YouTuber & -Creator | BrickSpecs",
  description:
    "Kostenloser Investor-Lifetime-Zugang, eigener Empfehlungslink mit Umsatzbeteiligung und Vorstellung auf BrickSpecs - das Creator-Programm für LEGO-YouTuber und -Creator.",
};

export default function PartnerPage() {
  return <PartnerClient />;
}
