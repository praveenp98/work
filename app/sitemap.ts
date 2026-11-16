import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { liveTools } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, priority: 1 },
    { url: `${SITE.url}/tools`, lastModified: now, priority: 0.9 },
    ...liveTools().map((t) => ({ url: `${SITE.url}/tools/${t.slug}`, lastModified: now, priority: 0.9 })),
    { url: `${SITE.url}/pricing`, lastModified: now, priority: 0.8 },
    ...["privacy", "terms", "refunds"].map((p) => ({ url: `${SITE.url}/${p}`, lastModified: now, priority: 0.2 })),
  ];
}
