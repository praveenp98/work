import { decodeShare } from "@/lib/wrapped";
import { wrappedImage } from "@/lib/wrapped-image";

/** Seller Wrapped images: /api/magnets/card?c=<share code>&f=story|post. The code holds numbers only, never names. */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  return wrappedImage(decodeShare(q.get("c") ?? ""), q.get("f") === "story" ? "story" : "post");
}
