import { ogImage } from "@/lib/og";
import { toolBySlug } from "@/lib/tools";

export { contentType, size } from "@/lib/og";
const tool = toolBySlug("coupon-calculator")!;
export const alt = `${tool.name}: ${tool.short} Free, no login.`;

export default function Image() {
  return ogImage({ kicker: "Free tool", title: tool.name, sub: tool.short, chip: "Free, no login", pose: "judge" });
}
