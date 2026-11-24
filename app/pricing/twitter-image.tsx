import { ogImage } from "@/lib/og";
import { OFFER } from "@/marketing/config/offer";

export { contentType, size } from "@/lib/og";
const line = `${OFFER.price.from} · or ${OFFER.price.monthlyText}/mo`;
export const alt = `Hire Rocco, your AI Amazon manager: ${line}. ${OFFER.guarantee.short}.`;

export default function Image() {
  return ogImage({ kicker: "Hire Rocco", title: OFFER.price.from, sub: `or ${OFFER.price.monthlyText}/mo. Whole team, ${OFFER.price.yearlyPerk} on yearly.`, pose: "wave" });
}
