import { ogImage } from "@/lib/og";

/** Share image for a Seller Wrapped link: /api/magnets/card?d=<base64 JSON of the card>. Only what the seller chose to show. */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const d = new URL(req.url).searchParams.get("d") ?? "";
  let c: Record<string, string> = {};
  try { c = JSON.parse(Buffer.from(d.slice(0, 1500), "base64").toString("utf8")); } catch { /* bad card → generic image */ }
  const s = (k: string, n = 60) => String(c[k] ?? "").replace(/[\u0000-\u001f]/g, "").slice(0, n);
  const bits = [s("s") && `Sales ${s("s", 16)}`, s("u") && `${s("u", 12)} units`, s("b") && `MVP: ${s("b", 40)}`, s("w") && `Search of the year: “${s("w", 40)}”`].filter(Boolean).join(" · ");
  return ogImage({ kicker: "Amazon Seller Wrapped", title: s("p") ? `I'm ${s("p")}` : "Amazon Seller Wrapped", sub: [s("l", 80), bits].filter(Boolean).join(" "), chip: "Get yours free at rocco.works", pose: "party" });
}
