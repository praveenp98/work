"use client";
/** Ask rocco.works for a fresh iMessage link (only on a real tap) and open it. Returns false if none is available. */
export async function startText(opts: { q?: string; t?: string; join?: string } = {}): Promise<boolean> {
  const d = await fetch("/api/text/start", {
    method: "POST",
    headers: { "content-type": "application/json", "x-rocco-tap": "1" },
    body: JSON.stringify(opts),
  }).then((r) => r.json()).catch(() => null) as { url?: string } | null;
  if (!d?.url) return false;
  window.location.href = d.url;
  return true;
}
