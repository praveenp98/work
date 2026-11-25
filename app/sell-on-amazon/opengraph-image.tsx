import { ogImage } from "@/lib/og";

export { contentType, size } from "@/lib/og";
export const alt = "How to start selling on Amazon in 2026: which marketplace, what it costs, what changed.";

export default async function Image() {
  return ogImage({ kicker: "Beginner's guide · 8 marketplaces", title: "Start selling on Amazon in 2026", sub: "US, UK, Germany, Canada, India, Australia, Japan, UAE. Costs, tax, compliance, first 90 days.", chip: "Every number sourced", pose: "wave" });
}
