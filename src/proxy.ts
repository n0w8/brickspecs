// Session-Refresh fuer Supabase-Auth (Muster aus @supabase/ssr).
// Hinweis: In Next 16 heisst die Middleware-Datei "proxy.ts" (middleware.ts
// ist deprecated). Ohne Supabase-Env-Variablen wird nur durchgereicht -
// die Seite funktioniert dann exakt wie bisher (localStorage-Modus).

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Wichtig: getUser() validiert das Token und erneuert abgelaufene Sessions.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Alle Pfade AUSSER:
     * - api/ (Katalog, Preise, Scan, Newsletter - brauchen keine Session)
     * - _next/static, _next/image (Build-Assets, Bilder)
     * - Icons/Manifest/SEO-Dateien und alle statischen Dateiendungen
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json|wasm)$).*)",
  ],
};
