import { phasesOf, upcoming, type Market, type SeasonEvent } from "./season";

/**
 * Calendar feed lines (iCalendar VEVENTs) for the seller's year: each event on its dates, plus a "prepare" and a
 * "ramp up" reminder before peaks and gifting days, each with the actions for that phase. Shared by the public feed
 * (/amazon-seller-calendar/feed/<market>) and each team's private feed (/w/<token>/calendar.ics).
 */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
const day = (iso: string, k = 0) => new Date(Date.parse(`${iso}T00:00:00Z`) + k * 86_400_000);
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");

export function allDay(uid: string, start: Date, end: Date, title: string, desc: string, rrule?: string): string {
  return ["BEGIN:VEVENT", `UID:${uid}@rocco.works`, `DTSTAMP:${stamp()}`, `DTSTART;VALUE=DATE:${ymd(start)}`, `DTEND;VALUE=DATE:${ymd(new Date(end.getTime() + 86_400_000))}`, ...(rrule ? [`RRULE:${rrule}`] : []), `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(desc)}`, "END:VEVENT"].join("\r\n");
}

const steps = (e: SeasonEvent, key: string) => (phasesOf(e.kind).find((p) => p.key === key)?.actions ?? []).map((a) => `• ${a.text}: ${a.why}`).join("\n");

export function seasonEvents(market: Market, prefix: string, link: string, now = new Date()): string[] {
  const out: string[] = [];
  for (const e of upcoming(market, now, 400)) {
    const tag = e.expected ? " (expected)" : "";
    out.push(allDay(`${prefix}-${e.id}`, day(e.start), day(e.end), `🛒 ${e.name}${tag}`, `${e.note ? e.note + "\n\n" : ""}${steps(e, e.kind === "peak" ? "live" : e.kind === "gifting" ? "last" : phasesOf(e.kind)[0].key)}\n\n${link}`));
    if (e.kind === "peak" || e.kind === "gifting") {
      const prep = day(e.start, -35), ramp = day(e.start, e.kind === "peak" ? -14 : -14);
      if (prep > now) out.push(allDay(`${prefix}-prep-${e.id}`, prep, prep, `🦝 Start preparing for ${e.name}`, `${steps(e, "prepare")}\n\n${link}`));
      if (ramp > now) out.push(allDay(`${prefix}-ramp-${e.id}`, ramp, ramp, `🦝 ${e.name} in 2 weeks: ramp up`, `${steps(e, "ramp")}\n\n${link}`));
    }
  }
  return out;
}

export const wrapCalendar = (name: string, events: string[]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//rocco.works//Rocco//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${esc(name)}`, "REFRESH-INTERVAL;VALUE=DURATION:PT12H", "X-PUBLISHED-TTL:PT12H", ...events, "END:VCALENDAR"].join("\r\n");
