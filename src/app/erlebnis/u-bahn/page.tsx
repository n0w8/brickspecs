import { notFound } from "next/navigation";

// U-Bahn-Erlebnis wurde auf Wunsch entfernt (05.07.2026) - Route liefert 404.
// Die unbenutzte Animations-Komponente liegt noch unter src/components/subway/
// und kann zusammen mit diesem Ordner manuell geloescht werden.
export default function RemovedSubwayPage() {
  notFound();
}
