import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/**
 * Calendar feed for a workspace: follow-up checks for every logged change, a weekly Monday brief,
 * and peak-season dates. Subscribe once (webcal://) and Rocco's reminders show up in Google/Apple/Outlook.
 */
export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");

function allDay(uid: string, date: Date, title: string, desc: string, rrule?: string) {
  const next = new Date(date.getTime() + 86400000);
  return ["BEGIN:VEVENT", `UID:${uid}@rocco.works`, `DTSTAMP:${stamp()}`, `DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${ymd(next)}`, ...(rrule ? [`RRULE:${rrule}`] : []), `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(desc)}`, "END:VEVENT"].join("\r\n");
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = getStore();
  const ws = store ? await loadWorkspace(store, token) : null;
  if (!store || !ws) return new Response("Not found", { status: 404 });
  const actions = await store.listActions(ws.id, { status: ["applied", "not_enough_data"], limit: 300 });

  // group follow-ups by day so the calendar stays readable
  const byDay = new Map<string, typeof actions>();
  for (const a of actions) byDay.set(a.followUpAt.slice(0, 10), [...(byDay.get(a.followUpAt.slice(0, 10)) ?? []), a]);
  const events: string[] = [];
  for (const [d, list] of byDay) {
    events.push(allDay(`check-${ws.id}-${d}`, new Date(d + "T00:00:00Z"), `🦝 Rocco: check ${list.length} change${list.length === 1 ? "" : "s"}`,
      `Open your Rocco (rocco.works → Sign in) to see how last week's changes did. Rocco re-checks each one against fresh Amazon data and marks it worked, flat or undo.\n\n${list.map((a) => `${a.code}: ${a.proposal.target} (${a.proposal.kind})`).join("\n")}`));
  }
  const monday = new Date("2026-11-23T00:00:00Z");
  events.push(allDay(`brief-${ws.id}`, monday, "🦝 Rocco: Monday brief", 'Open your Rocco (rocco.works → Sign in): today\'s jobs are ready. Tap approve and Rocco makes them in Amazon.', "FREQ=WEEKLY;BYDAY=MO"));
  for (const [d, t] of [["2026-11-25", "Set Black Friday budgets tonight"], ["2026-11-27", "Black Friday: check budgets 3–4×"], ["2026-11-30", "Cyber Monday: check budgets 3–4×"], ["2026-12-01", "BFCM post-mortem: run reports for Nov 19–30"]] as const) {
    events.push(allDay(`bfcm-${d}`, new Date(d + "T00:00:00Z"), `🦝 ${t}`, "From Rocco's peak-season playbook."));
  }
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//rocco.works//Rocco//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Rocco (Amazon)", "REFRESH-INTERVAL;VALUE=DURATION:PT6H", ...events, "END:VCALENDAR"].join("\r\n");
  return new Response(body, { headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "no-store" } });
}
