import Link from "next/link";
import type { JobKind } from "@/lib/jobs";
import { fmtDate, MARKETS, momentsOn, upcoming, when, type Market } from "@/lib/season";

/**
 * "What the calendar means for you today" on the dashboard: the most urgent event for this account's marketplace
 * (Black Friday ramp, Christmas gift rush, Q4 storage, January reset…), its phase, a countdown, and 3–4 actions.
 * Each action points at the matching job in today's list when Rocco has one, says when Rocco does it himself,
 * or links to the right page. Server-rendered; dates from lib/season.ts.
 */
export function SeasonCard({ market, token, jobKinds, now = new Date() }: { market: Market; token: string; jobKinds: JobKind[]; now?: Date }) {
  const moments = momentsOn(market, now);
  const m = moments.find((x) => x.event.kind === "peak" || x.event.kind === "gifting") ?? moments[0];
  const next = upcoming(market, now).filter((e) => e.kind !== "fees" && e.kind !== "returns" && e.id !== m?.event.id).slice(0, 3);
  const mk = MARKETS.find((x) => x.code === market)!;
  if (!m) {
    if (!next.length) return null;
    return (
      <section className="ss ss-quiet" aria-label="Coming up">
        <span className="ss-k">{mk.flag} Coming up on Amazon</span>
        <p className="ss-next">{next.map((e) => <span key={e.id}><b>{e.name}</b> {fmtDate(e.start)}{e.expected ? " (expected)" : ""}</span>)}</p>
      </section>
    );
  }
  const others = moments.filter((x) => x !== m).slice(0, 2);
  const live = m.phase.key === "live";
  const href = (h: string) => (h === "products" ? `/w/${token}/products` : h);
  return (
    <section className={`ss${live ? " is-live" : ""}`} aria-label={`${m.event.name}: ${m.phase.label}`}>
      <div className="ss-head">
        <div>
          <span className="ss-k">{mk.flag} {m.phase.label} · {m.event.name}</span>
          <h3>{m.event.name} {when(m)}.</h3>
          {m.event.note && <p className="ss-note">{m.event.note}</p>}
        </div>
        <div className="ss-count" aria-hidden>{m.daysToStart > 0 ? <><b>{m.daysToStart}</b><small>day{m.daysToStart === 1 ? "" : "s"}</small></> : m.daysToEnd >= 0 ? <><b>LIVE</b><small>now</small></> : <><b>✓</b><small>after</small></>}</div>
      </div>
      <ol className="ss-acts">
        {m.actions.map((a) => {
          const job = a.job?.find((k) => jobKinds.includes(k));
          return (
            <li key={a.id}>
              <div><b>{a.text}</b><small>{a.why}</small></div>
              {job ? <a className="ss-go" href={`#job-${job}`}>In today&apos;s jobs ↓</a>
                : a.auto ? <span className="ss-auto">✓ Rocco does this</span>
                : a.href ? <Link className="ss-go" href={href(a.href)}>Open →</Link>
                : a.job ? <span className="ss-ok">✓ Nothing needed today</span> : null}
            </li>
          );
        })}
      </ol>
      {(others.length > 0 || next.length > 0) && (
        <p className="ss-next">
          {others.map((o) => <span key={o.event.id}><b>{o.event.name}</b> {when(o)}</span>)}
          {next.slice(0, 3 - others.length).map((e) => <span key={e.id}><b>{e.name}</b> {fmtDate(e.start)}{e.expected ? " (expected)" : ""}</span>)}
          <Link href={`/amazon-seller-calendar/${mk.slug}`}>Full calendar →</Link>
        </p>
      )}
    </section>
  );
}
