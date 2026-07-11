import type { Metadata } from "next";
import BoxScannerClient from "./BoxScannerClient";

export const metadata: Metadata = {
  title: "LEGO Minifiguren Box-Code-Scanner - welche Figur ist in der Box? | BrickSpecs",
  description:
    "Data-Matrix-Code auf der Minifiguren-Blind-Box scannen und sofort sehen, welche Sammelfigur drinsteckt. Serie 28 und 29, direkt im Browser, ohne App.",
};

export default function BoxScannerPage() {
  return <BoxScannerClient />;
}
