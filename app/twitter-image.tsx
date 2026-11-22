import { ogImage } from "@/lib/og";

export { alt, contentType, size } from "@/lib/og";

/** The link card for rocco.works and every page without its own image. */
export default function Image() {
  return ogImage({ title: "Your AI Amazon manager.", sub: "Every morning I find what to fix. You approve, I make the change in Amazon." });
}
