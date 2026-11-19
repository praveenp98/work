/**
 * Cloudflare Email Worker for Rocco's report inbox (free).
 * Setup (docs/REPORTS-INBOX.md): Cloudflare → Email Routing on the inbox domain → catch-all → "Send to a Worker" → this
 * worker. Worker variables: ROCCO_URL = https://rocco.works/api/inbound/email, ROCCO_INBOUND_SECRET = same as Vercel.
 */
export default {
  async email(message, env) {
    const raw = await new Response(message.raw).arrayBuffer();
    const res = await fetch(env.ROCCO_URL, {
      method: "POST",
      headers: { "content-type": "message/rfc822", "x-rocco-inbound-secret": env.ROCCO_INBOUND_SECRET, "x-rocco-to": message.to },
      body: raw,
    });
    if (res.status === 401) message.setReject("Rocco inbox misconfigured");
  },
};
