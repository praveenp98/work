import { SELL, sellBySlug } from "@/lib/sell-data";
import { ogImage } from "@/lib/og";

export { contentType, size } from "@/lib/og";
export const alt = "A complete beginner's guide to selling on Amazon in one country.";
export const generateStaticParams = () => SELL.filter((g) => g.slug !== "index").map((g) => ({ market: g.slug }));

export default async function Image({ params }: { params: Promise<{ market: string }> }) {
  const g = sellBySlug((await params).market);
  return ogImage({ kicker: `Beginner's guide · ${g?.marketplace ?? "Amazon"}`, title: g ? `Start selling on Amazon ${g.country} in 2026` : "Start selling on Amazon", sub: "Costs, tax, compliance, the first 90 days. Every number sourced.", chip: "Updated for 2026", pose: "wave" });
}
