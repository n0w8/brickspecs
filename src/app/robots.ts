import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://brickspecs.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private bzw. interne Bereiche: API, Admin und Nutzer-Seiten
      // (zusaetzlich per robots-Metadata noindex markiert).
      disallow: ["/api/", "/admin", "/profil", "/portfolio", "/preisalarm", "/wishlist", "/auth/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
