import { MAGNETS, magnet } from "@/lib/magnets";
import { ogImage } from "@/lib/og";

export { contentType, size } from "@/lib/og";
export const alt = "A free Rocco tool for Amazon sellers.";
export const generateStaticParams = () => MAGNETS.map((m) => ({ slug: m.slug }));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const m = magnet((await params).slug);
  return ogImage({ kicker: `Free tool ${m?.n ?? ""}`, title: m?.name ?? "Free Amazon seller tools", sub: m?.tagline, chip: "Free · reports stay in your browser", pose: m?.pose ?? "hero" });
}
