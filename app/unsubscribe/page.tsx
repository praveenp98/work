import type { Metadata } from "next";
import { maskEmail, readUnsubscribeToken } from "@/lib/leads";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** /unsubscribe?token=… : one button, no login. The token is the email plus a signature (lib/leads.ts). */
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; done?: string; bad?: string }> }) {
  const sp = await searchParams;
  const email = readUnsubscribeToken(sp.token);
  return (
    <section className="answer" style={{ textAlign: "center", paddingTop: 40 }}>
      {sp.done && email ? (
        <>
          <h1>You&apos;re unsubscribed.</h1>
          <p className="answer-p">I won&apos;t send tips or product emails to <b>{maskEmail(email)}</b> again. Changed your mind? Email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
        </>
      ) : email ? (
        <>
          <h1>Unsubscribe?</h1>
          <p className="answer-p">Stop tips and product emails to <b>{maskEmail(email)}</b>.</p>
          <form method="post" action="/api/leads/unsubscribe" style={{ marginTop: 18 }}>
            <input type="hidden" name="token" value={sp.token} />
            <button className="btn" type="submit">Yes, unsubscribe me</button>
          </form>
        </>
      ) : (
        <>
          <h1>That link didn&apos;t work.</h1>
          <p className="answer-p">It may be cut off or out of date. Email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> from your address and I&apos;ll take you off the list.</p>
        </>
      )}
    </section>
  );
}
