import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/w/", "/mcp/", "/text", "/j/", "/oauth/"] }], sitemap: `${SITE.url}/sitemap.xml` };
}
