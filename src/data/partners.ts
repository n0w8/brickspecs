// Creator-Partner fuer die /partner-Seite ("Unsere Partner").
// Neue Partner einfach hier ergaenzen - die Sektion rendert sich automatisch,
// sobald mindestens ein Eintrag existiert.

import type { LocalizedString } from "@/data/types";

export interface Partner {
  /** Anzeigename des Kanals/Creators */
  name: string;
  /** Link zum Kanal/Profil */
  channelUrl: string;
  /** Plattform, z. B. "YouTube", "Instagram", "TikTok" */
  platform: string;
  /** Optionales Avatar-/Logo-Bild */
  avatarUrl?: string;
  /** Kurzvorstellung in beiden Sprachen */
  blurb: LocalizedString;
}

export const PARTNERS: Partner[] = [];
