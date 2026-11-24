import { ogImage } from "@/lib/og";

export { contentType, size } from "@/lib/og";
export const alt = "Free Amazon Black Friday and Cyber Monday ads checklist 2026 from Rocco. Free PDF.";

export default function Image() {
  return ogImage({ kicker: "Free checklist", title: "Black Friday + Cyber Monday ads checklist 2026", sub: "Day by day: before, during and after.", chip: "Free PDF" });
}
