import { ogImage } from "@/lib/og";

export { contentType, size } from "@/lib/og";
export const alt = "Free Amazon seller tools from Rocco. Free, no login.";

export default function Image() {
  return ogImage({ kicker: "Free tools", title: "Free Amazon seller tools.", sub: "Ad audit, account check, coupon and breakeven ACoS calculators. They run in your browser.", chip: "Free, no login", pose: "judge" });
}
