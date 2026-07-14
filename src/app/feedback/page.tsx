import type { Metadata } from "next";
import FeedbackClient from "./FeedbackClient";

export const metadata: Metadata = {
  title: "Feedback & Verbesserungsvorschläge | BrickSpecs",
  description:
    "Vorschlag, Fehler oder Datenfehler gefunden? Schick uns dein Feedback - wir lesen jede Nachricht und bauen BrickSpecs damit besser.",
};

export default function FeedbackPage() {
  return <FeedbackClient />;
}
