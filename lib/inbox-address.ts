import type { Store, Workspace } from "./store/types";
import { ensureLinkCode } from "./workspace";

/** The team's report inbox: <link code>@in.rocco.works (ROCCO_INBOX_DOMAIN). Kept apart from lib/inbox.ts so pages don't load the email parsers. */
export const INBOX_DOMAIN = (process.env.ROCCO_INBOX_DOMAIN || "in.rocco.works").toLowerCase();

export async function inboxAddress(store: Store, ws: Workspace): Promise<string> {
  return `${(await ensureLinkCode(store, ws)).toLowerCase()}@${INBOX_DOMAIN}`;
}
