import { SITE } from "@/lib/site";
import type { ToolMeta } from "@/lib/tools";
import { JsonLd } from "./JsonLd";

export function ToolJsonLd({ tool }: { tool: ToolMeta }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: `${SITE.url}/tools/${tool.slug}`,
        description: tool.description,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
      }}
    />
  );
}
