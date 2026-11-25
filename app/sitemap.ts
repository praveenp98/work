import type { MetadataRoute } from "next";
import { COMPETITORS } from "@/lib/compare";
import { ANSWERS } from "@/lib/answers";
import { GUIDES } from "@/lib/guides";
import { HELP } from "@/lib/help";
import { SITE } from "@/lib/site";
import { liveTools } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, priority: 1 },
    { url: `${SITE.url}/tools`, lastModified: now, priority: 0.9 },
    ...liveTools().map((t) => ({ url: `${SITE.url}/tools/${t.slug}`, lastModified: now, priority: 0.9 })),
    { url: `${SITE.url}/rocco`, lastModified: now, priority: 0.5 },
    { url: `${SITE.url}/guides`, lastModified: now, priority: 0.8 },
    ...GUIDES.map((g) => ({ url: `${SITE.url}/guides/${g.slug}`, lastModified: new Date(g.updated), priority: 0.7 })),
    { url: `${SITE.url}/answers`, lastModified: now, priority: 0.8 },
    ...ANSWERS.map((a) => ({ url: `${SITE.url}/answers/${a.slug}`, lastModified: new Date(a.updated), priority: 0.8 })),
    { url: `${SITE.url}/pricing`, lastModified: now, priority: 0.8 },
    { url: `${SITE.url}/compare/dr-ppc`, lastModified: now, priority: 0.8 },
    { url: `${SITE.url}/compare`, lastModified: now, priority: 0.7 },
    { url: `${SITE.url}/connector`, lastModified: now, priority: 0.7 },
    ...["claude", "chatgpt"].map((s) => ({ url: `${SITE.url}/compare/${s}`, lastModified: now, priority: 0.8 })),
    ...COMPETITORS.map((c) => ({ url: `${SITE.url}/compare/${c.slug}`, lastModified: now, priority: 0.7 })),
    { url: `${SITE.url}/demo`, lastModified: now, priority: 0.9 },
    { url: `${SITE.url}/free/black-friday-checklist`, lastModified: now, priority: 0.8 },
    { url: `${SITE.url}/help`, lastModified: now, priority: 0.7 },
    ...HELP.map((h) => ({ url: `${SITE.url}/help/${h.slug}`, lastModified: new Date(h.updated), priority: 0.6 })),
    ...["privacy", "terms", "refunds"].map((p) => ({ url: `${SITE.url}/${p}`, lastModified: now, priority: 0.2 })),
  ];
}
