import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel/Serverless: Die Katalog-JSONs werden zur Laufzeit per fs gelesen
  // (src/lib/catalog.ts, minifig-catalog.ts). Dynamische fs-Pfade werden vom
  // File-Tracing nicht automatisch erkannt, daher explizit einschliessen.
  outputFileTracingIncludes: {
    "/**": ["./src/data/catalog/*.json"],
  },
};

export default nextConfig;
