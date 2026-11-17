import type { Metadata } from "next";
import { RoccoHead } from "@/components/Rocco";
import { readClient } from "@/lib/oauth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connect Rocco", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;
const one = (v: SP[string]) => (Array.isArray(v) ? v[0] : v) ?? "";

/** The page Claude/ChatGPT opens when someone adds Rocco. One action: Connect. */
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const clientId = one(sp.client_id);
  const redirectUri = one(sp.redirect_uri);
  const client = readClient(clientId);
  const valid = client && client.ru.includes(redirectUri) && one(sp.response_type) === "code" && one(sp.code_challenge) && (one(sp.code_challenge_method) || "S256") === "S256";
  const app = client?.n && !/^(mcp|client)/i.test(client.n) ? client.n : "your AI";

  if (!valid) {
    return (
      <section className="start-page">
        <h1>That link didn&apos;t work.</h1>
        <p className="hello-lede">Try adding Rocco again from your AI app&apos;s connector settings.</p>
      </section>
    );
  }

  return (
    <section className="start-page">
      <div className="start-head">
        <div className="hello-avatar small"><svg width="56" height="46" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="oauth" /></svg><span className="online" aria-hidden /></div>
        <h1>Connect Rocco to {app}.</h1>
      </div>
      <form className="start-card" method="post" action="/oauth/authorize/approve">
        {["client_id", "redirect_uri", "state", "code_challenge", "scope", "resource"].map((k) => <input key={k} type="hidden" name={k} value={one(sp[k])} />)}
        <h2>Your private Rocco</h2>
        <p className="start-sub">I remember every change, check if it worked, and text your team the numbers every morning. Nothing changes in Amazon without your approval.</p>
        <button className="btn start-main">Connect</button>
        <details className="oauth-existing">
          <summary>Already use Rocco?</summary>
          <p className="fine">Paste your Rocco page link (rocco.works/w/…) so {app} uses the same memory and team.</p>
          <input name="existing" placeholder="https://rocco.works/w/rw_…" autoComplete="off" />
        </details>
        <p className="fine">Free to use. No password: this connection is your team&apos;s private key.</p>
      </form>
    </section>
  );
}
