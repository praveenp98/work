/** The one door to the offer and the sample account. Scenes import from here, never from literals. */
export { OFFER, PRICE_RISE, ACCOUNTS, TIME_MATH, LINKS, HANDLES, SITE_URL } from "../../config/offer";
export { SAMPLE, SAMPLE_DOLLAR_AMOUNTS } from "../../config/sample";
import { SAMPLE, SAMPLE_DOLLAR_AMOUNTS } from "../../config/sample";

const DOLLAR = /\$\s?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?/g;
const sampleSet = new Set(SAMPLE_DOLLAR_AMOUNTS.map((n) => String(n)));

/** True when text shows the sample account: its name or one of its numbers. Such text must sit next to the chip. */
export function usesSample(text: string): boolean {
  if (text.includes(SAMPLE.brand)) return true;
  for (const m of text.matchAll(DOLLAR)) if (sampleSet.has(String(Number(`${m[1].replace(/,/g, "")}${m[2] ?? ""}`)))) return true;
  return false;
}
