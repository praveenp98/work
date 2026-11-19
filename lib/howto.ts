import type { Proposal } from "./rules/types";

const money = (n?: number) => (n === undefined ? "" : `$${n.toFixed(2)}`);

/**
 * Exact steps to make one approved change by hand in the Amazon Ads console (report-inbox teams have no connector
 * to do it for them). Menu names vary a little by marketplace; the campaign / ad group / term are exact.
 */
export function howTo(p: Proposal): string {
  const where = `Campaign Manager → “${p.campaign}”${p.adGroup ? ` → ad group “${p.adGroup}”` : ""}`;
  switch (p.kind) {
    case "negative":
      return `${where} → Negative targeting → Add “${p.target}” as ${p.matchType ?? "negative exact"} → Save.`;
    case "harvest":
      return `Add “${p.target}” as an exact keyword${p.proposed ? ` at ${money(p.proposed)}` : ""} in your manual exact campaign. Then ${p.reason.split("Then ")[1] ?? "add it as a negative exact where it came from."}`;
    case "bid":
      return `${where} → Targeting → “${p.target}”${p.matchType ? ` (${p.matchType})` : ""} → bid ${money(p.current)} → ${money(p.proposed)} → Save.`;
    case "budget":
      return `Campaign Manager → “${p.campaign}” → Settings → Daily budget ${money(p.current)} → ${money(p.proposed)} → Save.`;
    case "placement":
      return `Campaign Manager → “${p.campaign}” → Settings → Adjust bids by placement → ${p.target}${p.proposed !== undefined ? ` → ${Math.round(p.proposed)}%` : ""} → Save.`;
    default:
      return p.reason;
  }
}
