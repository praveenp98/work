import Link from "next/link";
import { PARTNER_PAGES, EXAMPLE, sharePct, PAYOUT_LINE, type Block, type ToolLink } from "@/lib/partners";

/** Server-only building blocks shared by the partner pages and /p/<code> (no client JS here). */
export function PartnerNav({ current }: { current: string }) {
  const items = [{ path: "/partners", nav: "Overview" }, ...PARTNER_PAGES.map((p) => ({ path: p.path, nav: p.nav }))];
  return (
    <nav className="pt-nav" aria-label="Partner program">
      {items.map((i) => <Link key={i.path} href={i.path} aria-current={i.path === current ? "page" : undefined}>{i.nav}</Link>)}
    </nav>
  );
}

export function Blocks({ items }: { items: Block[] }) {
  return <div className="pr-groups">{items.map((b) => <div key={b.t} className="pr-group"><h3>{b.t}</h3><p className="pt-d">{b.d}</p></div>)}</div>;
}

export function Steps({ items }: { items: Block[] }) {
  return <ol className={`pr-steps${items.length === 4 ? " pt-steps4" : ""}`}>{items.map((s, i) => <li key={s.t}><span>{i + 1}</span><b>{s.t}</b><p>{s.d}</p></li>)}</ol>;
}

export function ToolList({ tools }: { tools: ToolLink[] }) {
  return <div className="grid">{tools.map((t) => <Link key={t.href} className="card mg-mini" href={t.href}><small>FREE</small><h3>{t.name}</h3><p className="muted">{t.note}</p><span className="more">Open →</span></Link>)}</div>;
}

export function Offer() {
  return (
    <div className="pt-offer">
      <div><b>{sharePct()}</b><span>of the seller&apos;s first payment</span></div>
      <div><b>{EXAMPLE.yearlyPayout}</b><span>per yearly plan ({EXAMPLE.yearly})</span></div>
      <div><b>{EXAMPLE.monthlyPayout}</b><span>per monthly plan ({EXAMPLE.monthly})</span></div>
      <p className="fine">{PAYOUT_LINE} No fees, no paid posts, no retainers.</p>
    </div>
  );
}

