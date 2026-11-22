/**
 * Server-side funnel events (signed up, paid, Amazon connected, first jobs, approvals) to PostHog's capture API.
 * Fire-and-forget: never slows or breaks a request. Off without NEXT_PUBLIC_POSTHOG_KEY. distinctId = workspace id.
 */
const HOST = process.env.POSTHOG_HOST || "https://us.i.posthog.com";

export function trackServer(distinctId: string, event: string, props: Record<string, string | number | boolean | undefined> = {}): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || !distinctId) return;
  fetch(`${HOST}/capture/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: key, event, distinct_id: distinctId, properties: { ...props, $lib: "rocco-server" }, timestamp: new Date().toISOString() }),
  }).catch(() => {});
}
