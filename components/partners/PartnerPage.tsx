import Link from "next/link";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { EXAMPLE, HOW_IT_WORKS, LINK_RULES, PARTNER_PAGES, PARTNER_TYPES, REACH_BANDS, ROCCO_DOES, type PartnerPageCopy } from "@/lib/partners";
import { PLAN } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { PartnerApply } from "./PartnerApply";
import { Blocks, Offer, PartnerNav, Steps, ToolList } from "./Parts";

/** Shared layout for /partners and /partners/<type> (copy: lib/partners.ts). Server-rendered and static. */
export function PartnerPage({ page, hub = false }: { page: PartnerPageCopy; hub?: boolean }) {
  return (
    <section className="pr pt">
      <header className="pr-head">
        <PartnerNav current={page.path} />
        <span className="h5-kicker">{page.kicker}</span>
        <h1>{page.h1}</h1>
        <p className="pr-sub">{page.sub}</p>
        <p className="pt-cta"><a className="btn" href="#apply">Apply in 2 minutes</a> <Link className="btn ghost" href="/demo">See Rocco work</Link></p>
      </header>

      <section className="pr-sec">
        <h2>The offer</h2>
        <Offer />
      </section>

      <section className="pr-sec">
        <h2>{hub ? "What you get" : "What's in it for you"}</h2>
        <Blocks items={page.gets} />
      </section>

      {hub && (
        <section className="pr-sec">
          <h2>Who it&apos;s for</h2>
          <div className="grid">
            {PARTNER_PAGES.map((p) => <Link key={p.path} className="card mg-mini" href={p.path}><small>{p.nav.toUpperCase()}</small><h3>{p.kicker.replace(/^For /, "")}</h3><p className="muted">{p.h1}</p><span className="more">Read more →</span></Link>)}
          </div>
          <p className="fine center">Not sure which fits? Apply anyway and pick &quot;Something else&quot;.</p>
        </section>
      )}

      <section className="pr-sec">
        <h2>How it works</h2>
        <Steps items={page.steps ?? HOW_IT_WORKS} />
      </section>

      {page.tools && (
        <section className="pr-sec">
          <h2>{page.toolsTitle}</h2>
          {page.toolsNote && <p className="pr-sub pt-center">{page.toolsNote}</p>}
          <ToolList tools={page.tools} />
        </section>
      )}

      <section className="pr-sec">
        <h2>What sellers get from Rocco</h2>
        <Blocks items={ROCCO_DOES} />
        <p className="fine center">{EXAMPLE.yearly} a year or {EXAMPLE.monthly} a month, {PLAN.guaranteeDays}-day money-back guarantee. <Link href="/pricing">Pricing</Link> · <Link href="/free">Free tools</Link></p>
      </section>

      <section className="pr-sec">
        <h2>Links and disclosure</h2>
        <div className="pr-group pt-rules"><ul>{LINK_RULES.map((r) => <li key={r}>{r}</li>)}</ul></div>
      </section>

      <section className="pr-sec pr-faq">
        <h2>Questions</h2>
        <Faq items={page.faq} title={null} />
      </section>

      <section className="pr-sec pt-apply">
        <h2>{page.applyTitle}</h2>
        <PartnerApply types={PARTNER_TYPES} reach={REACH_BANDS} defaultType={hub ? undefined : page.type} title="Tell us about you" />
        <p className="fine center">Self-serve software only: partners refer sellers and can use Rocco themselves. Rocco doesn&apos;t sell services or book calls. {SITE.disclaimer}</p>
      </section>

      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: page.metaTitle, description: page.metaDescription, url: `${SITE.url}${page.path}`, publisher: { "@type": "Organization", name: SITE.name, url: SITE.url } }} />
    </section>
  );
}
