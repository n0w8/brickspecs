// Admin-Zugriff: fest verdrahtete Liste der Betreiber-Konten.
// Wird serverseitig geprueft (src/app/admin/page.tsx) - fuer alle anderen
// existiert die Admin-Seite schlicht nicht (404).

export const ADMIN_EMAILS = [
  "domsgard1337@gmail.com",
  "michiges@gmx.at",
  "business.domsgard@gmail.com",
] as const;

/** true, wenn die E-Mail zu einem Admin-Konto gehoert (case-insensitive). */
export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((a) => a === normalized);
}
