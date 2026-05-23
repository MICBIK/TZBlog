/**
 * Single-locale sitemap. Multi-locale alternates pending V3 (`i18n-locale-routing-v3` SDD).
 */
import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/lib/site-meta"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
