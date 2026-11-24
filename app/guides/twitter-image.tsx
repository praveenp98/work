import { ogImage } from "@/lib/og";

export { contentType, size } from "@/lib/og";
export const alt = "Amazon ads guides from Rocco, in plain English.";

export default function Image() {
  return ogImage({ kicker: "Guides", title: "Amazon ads guides, in plain English.", sub: "Negative keywords, ACoS, bids, harvesting, bulk files, Black Friday." });
}
