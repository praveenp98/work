import { SITE } from "@/lib/site";
import { liveTools } from "@/lib/tools";

export const dynamic = "force-static";

export function GET() {
  const body = [
    `# ${SITE.name} (${SITE.domain})`,
    "",
    `> ${SITE.description}`,
    "",
    "Rocco is self-serve software for Amazon sellers, freelancers and agencies. It analyzes Amazon Ads reports the user downloads (no account login, no API keys), scores ad waste A–F, and produces fixes: negative keywords, search terms to harvest as exact keywords, and bid changes capped at ±20% per step, plus an upload-ready bulk file. Files are processed in the browser and never stored.",
    "",
    "## Free tools",
    ...liveTools().map((t) => `- [${t.name}](${SITE.url}/tools/${t.slug}): ${t.description}`),
    "",
    "## Pricing",
    `- [Pricing](${SITE.url}/pricing): pay-once founding lifetime plans (Seller $149, Pro $299, Agency $399) and a $99 Holiday Pass.`,
    "",
    "## Notes",
    `- ${SITE.disclaimer}`,
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
