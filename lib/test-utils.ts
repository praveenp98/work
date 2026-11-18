import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

export function loadFixture(name: string): unknown[][] {
  const text = fs.readFileSync(path.join(__dirname, "..", "fixtures", name), "utf8");
  return Papa.parse<unknown[]>(text, { skipEmptyLines: true }).data;
}

/** Give a workspace a running 3-day trial (no free plan: most flows need access). */
export async function grantTrial(store: import("./store/types").Store, wsId: string, days = 3) {
  const ws = await store.getWorkspaceById(wsId);
  if (!ws) throw new Error("no workspace");
  ws.trialEndsAt = new Date(Date.now() + days * 86_400_000).toISOString();
  await store.saveWorkspace(ws);
  return ws;
}
/** The workspace a phone (or Slack user) is linked to. */
export async function wsOfPhone(store: import("./store/types").Store, phone: string) {
  const p = await store.getPhone(phone);
  return p ? store.getWorkspaceById(p.workspaceId) : null;
}
