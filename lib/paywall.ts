import { PRICE } from "./pricing";
import { hasAccess } from "./access";
import { checkoutUrl } from "./payments";
import { dollars, type PriceState } from "./pricing";
import { SITE } from "./site";
import type { Workspace } from "./store/types";
import type { buildBrief } from "./workspace";

/**
 * When Rocco asks for money. Never on the demo, setup, the first numbers or the free top-3 fixes.
 * Only at moments of proven value, each throttled so it never nags:
 *  - found:  he just found money and part of it is locked (every 3 days at most)
 *  - worked: a change he proposed was measured as working (once per win)
 *  - locked: they tried to approve a locked fix (always: they already want it)
 *  - team:   a second teammate joined (once)
 * Mutates ws.nudges; the caller saves the workspace.
 */
export type Moment = "found" | "worked" | "locked" | "team";
type Brief = Awaited<ReturnType<typeof buildBrief>>;
const DAY = 86_400_000;
const GAP: Record<Moment, number> = { found: 3 * DAY, worked: Infinity, locked: 0, team: Infinity };
const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Checkout tagged with the workspace, so the payment unlocks it automatically (see /api/dodo/webhook). */
export const hireUrl = (ws: Workspace) => checkoutUrl({ ref: ws.id, email: ws.ownerEmail, redirect: `${SITE.url}/welcome` }) ?? `${SITE.url}/pricing`;

export function paywall(
  ws: Workspace,
  b: Brief,
  moment: Moment,
  o: { now?: Date; price?: PriceState | null; key?: string; saved?: number } = {},
): { text: string; url: string } | null {
  if (hasAccess(ws, o.now)) return null;
  const now = o.now ?? new Date();
  const hidden = b.perBrand.reduce((t, x) => t + x.hidden, 0);
  const hiddenValue = b.perBrand.reduce((t, x) => t + (x.hiddenValue ?? 0), 0);
  const freeValue = b.perBrand.reduce((t, x) => t + x.openValue, 0);
  if (moment !== "locked" && !hidden) return null;
  const tag = o.key ? `${moment}:${o.key}` : moment;
  const last = ws.nudges?.[tag];
  if (last && now.getTime() - new Date(last).getTime() < GAP[moment]) return null;
  ws.nudges = { ...(ws.nudges ?? {}), [tag]: now.toISOString() };

  const total = `~${$(freeValue + hiddenValue)}/mo across ${hidden} fix${hidden === 1 ? "" : "es"}`;
  const offer = `Hire me: ${PRICE.short}, ${PRICE.then}. Whole team.`;
  const text = {
    found: `💰 I found ${total} in your account. ${offer}`,
    worked: `✅ That fix worked${o.saved ? ` (~${$(o.saved)} so far)` : ""}. Keep me on: ${offer}`,
    locked: `🔒 Approving fixes needs an active Rocco. ${offer}`,
    team: `Your team's on Rocco now 🦝 One plan covers everyone. ${offer}`,
  }[moment];
  return { text, url: hireUrl(ws) };
}
