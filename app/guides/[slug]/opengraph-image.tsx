import { GUIDES, guideBySlug } from "@/lib/guides";
import { ogImage } from "@/lib/og";

export { contentType, size } from "@/lib/og";
export const alt = "A Rocco guide for Amazon sellers.";
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  return ogImage({ kicker: "Guide", title: g?.title ?? "Amazon ads guides", pose: "hero" });
}
