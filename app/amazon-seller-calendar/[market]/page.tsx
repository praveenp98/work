import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { Rocco } from "@/components/Rocco";
import { fmtDate, MARKETS, phasesOf, upcoming } from "@/lib/season";
import { SITE } from "@/lib/site";

/** Public seller calendar per marketplace: every event for the next 12 months with what to change before, during and after. */
export const revalidate = 86400;
export const dynamicParams = false;
export const generateStaticParams = () => MARKETS.map((m) => ({ market: m.slug }));

const mk = async (p: Promise<{ market: string }>) => { const { market } = await p; return MARKETS.find((m) => m.slug === market); };

export async function generateMetadata({ params }: { params: Promise<{ market: string }> }): Promise<Metadata> {
  const m = await mk(params);
  if (!m) return {};
  const title = `Amazon seller calendar ${new Date().getUTCFullYear() + (new Date().getUTCMonth() >= 10 ? 1 : 0)}: ${m.name}`;
  const description = `Every Amazon sale, holiday and fee change for ${m.name} sellers, with what to change on your account before, during and after each one. Subscribe in your calendar.`;
  return { title, description, alternates: { canonical: `/amazon-seller-calendar/${m.slug}` } };
}

const shift = (d: string, k: number) => new Date(Date.parse(`${d}T00:00:00Z`) + k * 86_400_000).toISOString().slice(0, 10);

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  const m = await mk(params);
  if (!m) notFound();
  const events = upcoming(m.code, new Date(), 380);
  const feed = `${SITE.url.replace(/^https?:/, "webcal:")}/amazon-seller-calendar/feed/${m.slug}`;
  return (
    <section className="cal">
      <p className="fine"><Link href="/free">Free tools</Link> · Seller calendar</p>
      <h1>{m.flag} Amazon seller calendar: {m.name}</h1>
      <p className="sl-sub">Every sale, holiday and fee change for the next 12 months, and exactly what to change on your account before, during and after each. Dates Amazon announces each year are marked <i>expected</i> until confirmed.</p>
      <div className="cal-sub">
        <a className="btn" href={feed}>📅 Add to my calendar</a>
        <a className="btn ghost" href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feed)}`} target="_blank" rel="noopener">Google Calendar</a>
        <span className="fine">Reminders 5 weeks and 2 weeks before each event, with the to-do list inside. Free.</span>
      </div>
      <nav className="cal-tabs" aria-label="Marketplace">{MARKETS.map((x) => <Link key={x.slug} className={x.slug === m.slug ? "on" : ""} href={`/amazon-seller-calendar/${x.slug}`}>{x.flag} {x.name}</Link>)}</nav>

      <ol className="cal-list">
        {events.map((e) => {
          const ph = phasesOf(e.kind);
          return (
            <li key={e.id} className={`cal-ev k-${e.kind}`}>
              <div className="cal-date"><b>{fmtDate(e.start)}</b>{e.end !== e.start && <small>to {fmtDate(e.end)}</small>}{e.expected && <em>expected</em>}</div>
              <div className="cal-body">
                <h2>{e.name}</h2>
                {e.note && <p className="fine">{e.note}</p>}
                <div className="cal-phases">
                  {ph.map((p) => {
                    const from = p.from < 0 ? shift(e.start, p.from) : p.from === 0 ? e.start : shift(e.end, p.from);
                    return (
                      <details key={p.key}>
                        <summary><b>{p.label}</b> <span>{p.from < 0 ? `from ${fmtDate(from)}` : p.from === 0 ? (e.end !== e.start ? `${fmtDate(e.start)}–${fmtDate(e.end)}` : fmtDate(e.start)) : `from ${fmtDate(from)}`}</span></summary>
                        <ul>{p.actions.map((a) => <li key={a.id}><b>{a.text}.</b> {a.why}</li>)}</ul>
                      </details>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="cta-inline" style={{ margin: "30px 0" }}>
        <Rocco pose="hero" size={84} />
        <div style={{ flex: "1 1 260px" }}><b>Rocco runs this calendar on your account.</b><p className="muted" style={{ margin: 0 }}>Before each event Rocco lines up the stock, waste, budget and bid changes for your products, you tap approve, and he makes them in Amazon. On peak days he checks budgets at midday.</p></div>
        <Link className="btn small" href={`/?utm_source=calendar&utm_content=${m.slug}`}>Meet Rocco →</Link>
      </div>
      <Faq items={[
        { q: `When should I start preparing for big Amazon sales in ${m.name}?`, a: "About five weeks before: get stock into Amazon's warehouses, set up deals or coupons (Amazon closes deal submissions weeks ahead) and clean out wasted ad spend. Two weeks before, raise budgets on proven winners in steps." },
        { q: "Should I raise bids on Black Friday or Prime Day?", a: "Raise budgets on proven winners first, in steps of about 20%, so they don't run out of budget by midday. Leave bids on losing keywords alone, and don't restructure campaigns during the event." },
        { q: "What should I do after a big sale event?", a: "Bring bids and budgets back toward normal within a few days, end temporary coupons, and compare the event with the weeks before to keep what earned its money." },
        { q: "Are the Prime Day dates confirmed?", a: "Amazon announces Prime Day and Prime Big Deal Days dates each year, usually a few weeks ahead. Until then they're shown here as expected, based on when they usually happen." },
      ]} />
      <p className="fine">{SITE.disclaimer}</p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `Amazon seller calendar: ${m.name}`, itemListElement: events.map((e, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "Event", name: `${e.name} (Amazon ${m.name})`, startDate: e.start, endDate: e.end, eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode", location: { "@type": "VirtualLocation", url: `${SITE.url}/amazon-seller-calendar/${m.slug}` }, description: phasesOf(e.kind)[0].actions.map((a) => a.text).join("; ") } })) }} />
    </section>
  );
}
