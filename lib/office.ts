/**
 * Rocco's office (dashboard, desktop): a timeline of what Rocco REALLY did, built only from stored facts (pulls,
 * reports analyzed, jobs found, changes made, results measured), plus where Rocco is right now. The animation
 * replays this; nothing on screen is invented. Pure, tested in lib/office.test.ts.
 */
export type Station = "dock" | "desk" | "board" | "bell" | "lab" | "bed";
export interface OfficeEvent { at: string; station: Station; text: string }
export interface OfficeState { station: Station; text: string; nextRunAt?: string }

const REPORT: Record<string, string> = { sp_search_term: "ad search terms", sp_campaign: "ad campaigns", business_report: "sales & traffic", inventory: "FBA stock", listing_health: "listings", sp_placement: "placements" };
const name = (k: string) => REPORT[k] ?? k.replace(/_/g, " ");

export function buildOffice(o: {
  syncs: { at: string; kinds: string[]; errors: string[] }[];
  snaps: { createdAt: string; kind: string; headline: string }[];
  open: { count: number; valueMonthly: number; fmt: (n: number) => string };
  actions: { code: string; appliedAt: string; followUpAt: string; status: string; target?: string; result?: { checkedAt: string; summary: string } }[];
  now?: Date;
  /** Next morning round (ISO), for the idle state. */
  nextRunAt?: string;
  windowHours?: number;
}): { events: OfficeEvent[]; state: OfficeState } {
  const now = o.now ?? new Date();
  const since = now.getTime() - (o.windowHours ?? 72) * 3_600_000;
  const recent = (iso: string) => { const t = Date.parse(iso); return t >= since && t <= now.getTime() + 60_000; };
  const ev: OfficeEvent[] = [];

  for (const s of o.syncs.filter((x) => recent(x.at))) {
    if (s.kinds.length) ev.push({ at: s.at, station: "dock", text: `Pulled ${s.kinds.map(name).join(", ")} from Amazon` });
    if (s.errors.length && !s.kinds.length) ev.push({ at: s.at, station: "dock", text: `Went to Amazon; ${s.errors.length} report${s.errors.length > 1 ? "s" : ""} not ready yet` });
  }
  for (const s of o.snaps.filter((x) => recent(x.createdAt))) ev.push({ at: s.createdAt, station: "desk", text: `Ran the numbers on ${name(s.kind)}: ${s.headline.replace(/\.$/, "").slice(0, 110)}` });
  // Jobs found: just after the newest analysis in the window.
  const lastSnap = o.snaps.filter((x) => recent(x.createdAt)).map((x) => x.createdAt).sort().at(-1);
  if (lastSnap && o.open.count) ev.push({ at: new Date(Date.parse(lastSnap) + 1000).toISOString(), station: "board", text: `Pinned ${o.open.count} job${o.open.count > 1 ? "s" : ""} to your board${o.open.valueMonthly > 0 ? `, worth ~${o.open.fmt(o.open.valueMonthly)}/mo` : ""}` });
  for (const a of o.actions) {
    if (recent(a.appliedAt) && a.status !== "reverted") ev.push({ at: a.appliedAt, station: "dock", text: `Made ${a.code}${a.target ? ` (“${a.target.slice(0, 40)}”)` : ""} in Amazon ✓` });
    if (a.status === "reverted" && recent(a.appliedAt)) ev.push({ at: a.appliedAt, station: "dock", text: `Undid ${a.code} in Amazon` });
    if (a.result && recent(a.result.checkedAt)) ev.push({ at: a.result.checkedAt, station: "lab", text: `Checked ${a.code}: ${a.result.summary.slice(0, 110)}` });
  }
  ev.sort((a, b) => a.at.localeCompare(b.at));

  const latest = ev.at(-1);
  const waiting = o.actions.filter((a) => a.status === "applied" && Date.parse(a.followUpAt) > now.getTime()).length;
  const state: OfficeState = o.open.count
    ? { station: "bell", text: `${o.open.count} job${o.open.count > 1 ? "s" : ""} waiting for your OK` }
    : latest && now.getTime() - Date.parse(latest.at) < 10 * 60_000
      ? { station: latest.station, text: latest.text }
      : { station: "bed", text: `All caught up${waiting ? ` · watching ${waiting} change${waiting > 1 ? "s" : ""}` : ""}`, nextRunAt: o.nextRunAt };
  return { events: ev.slice(-14), state };
}
