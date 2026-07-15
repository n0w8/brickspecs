import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel/Serverless: Die Katalog-JSONs werden zur Laufzeit per fs gelesen
  // (src/lib/catalog.ts, minifig-catalog.ts). Dynamische fs-Pfade werden vom
  // File-Tracing nicht automatisch erkannt, daher explizit einschliessen.
  outputFileTracingIncludes: {
    "/**": ["./src/data/catalog/*.json"],
  },

  // Security-Header fuer alle Routen. Bewusst KEINE Content-Security-Policy:
  // die braeuchte gruendliche Tests gegen Stripe, Supabase, Vercel Analytics,
  // Rebrickable-/BrickLink-Bilder und zxing-wasm (jsdelivr) - siehe AUDIT.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // MIME-Sniffing verbieten
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Einbetten in fremde Frames verbieten (Clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Referrer nur als Origin an fremde Seiten weitergeben
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Kamera nur fuer die eigenen Scanner-Seiten, Rest gesperrt
          { key: "Permissions-Policy", value: "camera=(self), geolocation=(), microphone=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
