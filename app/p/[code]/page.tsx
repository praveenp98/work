import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { Blocks, ToolList } from "@/components/partners/Parts";
import { Rocco } from "@/components/Rocco";
import { approvedPartner } from "@/lib/partner-db";
import { cleanCode, LANDING, ROCCO_DOES } from "@/lib/partners";
import { SITE } from "@/lib/site";
import { trackServer } from "@/lib/track-server";

/**
 * The page a partner shares: rocco.works/p/<code>. The referral cookie is set by proxy.ts before this renders.
 * Only approved partners get a page; any other code goes to the home page. Never indexed; canonical is "/".
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recommended for Amazon sellers", robots: { index: false, follow: true }, alternates: { canonical: "/" } };

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const code = cleanCode((await params).code);
  const p = code ? await approvedPartner(code) : null;
  if (!p || !code) redirect("/");
  after(() => trackServer(`partner:${code}`, "partner_landing_viewed", { code, via: "page" }));
  return (
    <section className="pr pt">
      <header className="pr-head">
        <Rocco pose="wave" size={110} />
        <span className="h5-kicker">Recommended by {p.name}</span>
        <h1>{LANDING.h1(p.name)}</h1>
        <p className="pr-sub">{LANDING.sub}</p>
        <p className="pt-cta"><Link className="btn" href="/pricing">Hire Rocco</Link> <Link className="btn ghost" href="/free">Try a free tool first</Link></p>
        <p className="fine">{LANDING.hireNote}</p>
      </header>

      <section className="pr-sec">
        <h2>What Rocco does</h2>
        <Blocks items={ROCCO_DOES} />
      </section>

      <section className="pr-sec">
        <h2>Free tools, no sign-up</h2>
        <p className="pr-sub pt-center">Drop in the reports you already download from Amazon. They&apos;re read in your browser.</p>
        <ToolList tools={LANDING.tools} />
      </section>

      <section className="pr-sec pt-center">
        <p><Link className="btn" href="/pricing">Hire Rocco</Link></p>
        <p className="fine">
          {p.name} is a Rocco partner and may earn a share if you hire Rocco through this page. It doesn&apos;t change your price.
          {p.website && <> <a href={p.website} rel="sponsored noopener" target="_blank">Visit {p.name}</a>.</>}
        </p>
        <p className="fine">{SITE.disclaimer}</p>
      </section>
    </section>
  );
}
