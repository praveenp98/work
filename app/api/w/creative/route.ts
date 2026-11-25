import { adGroupMap, termsForProduct } from "@/lib/term-products";
import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { imageSlotBody, newCreative, planCreatives, promptProblems, type Concept, type CreativeKind } from "@/lib/creative";
import { datadoeOn } from "@/lib/datadoe";
import { higgsfieldOn, imageStatus, submitImage, uploadReference, ASPECTS, type Aspect } from "@/lib/higgsfield";
import { allow } from "@/lib/human";
import { fetchListings, verifiedWrite } from "@/lib/listings";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { approvedBy } from "@/lib/team";
import { trackServer } from "@/lib/track-server";
import { loadWorkspace } from "@/lib/workspace";
import type { TermLite } from "@/lib/rules/terms";

/**
 * Image studio (lib/creative.ts + lib/higgsfield.ts), per product:
 *  { op: "plan", sku, kind, note? }                         Opus plans 4–6 images from the listing → concepts + current photos
 *  { op: "render", sku, kind, concept, refs[] }             Higgsfield renders one concept from the product photo(s)
 *  { op: "status", id }                                     poll a render
 *  { op: "use", id, url, slot }                             put the image into listing slot 2–8 (Amazon checks it first)
 *  { op: "list", sku? }                                     recent images
 * Multipart POST with `file` (+ t, account) uploads a reference photo → { url }.
 */
export const maxDuration = 120;

type Body = { t?: string; account?: string; op?: string; sku?: string; kind?: CreativeKind; note?: string; concept?: Concept; refs?: string[]; id?: string; url?: string; slot?: number };

export async function POST(req: Request) {
  const multipart = (req.headers.get("content-type") ?? "").startsWith("multipart/");
  const form = multipart ? await req.formData().catch(() => null) : null;
  const b: Body = form ? { t: String(form.get("t") ?? ""), account: String(form.get("account") ?? ""), op: "upload" } : ((await req.json().catch(() => ({}))) as Body);
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to make listing images." }, { status: 402 });
  if (!higgsfieldOn()) return NextResponse.json({ ok: false, error: "Image making isn't switched on yet (Higgsfield key missing)." }, { status: 503 });
  const account = ws.amazon?.accounts?.find((a) => a.id === b.account) ?? ws.amazon?.accounts?.[0];
  if (!account || !datadoeOn()) return NextResponse.json({ ok: false, error: "Connect an Amazon account first." }, { status: 400 });
  if (!allow(`creative:${ws.id}`, 80, 10 * 60_000)) return NextResponse.json({ ok: false, error: "That's a lot of requests. Give it a minute." }, { status: 429 });
  const list = (ws.amazon!.creatives ??= []);
  const save = () => store.saveWorkspace(ws);
  const by = (await approvedBy(ws)).replace(" · approved by ", "") || "the owner";

  if (b.op === "upload") {
    const f = form?.get("file");
    if (!(f instanceof File)) return NextResponse.json({ ok: false, error: "Choose a photo." }, { status: 400 });
    const url = await uploadReference(await f.arrayBuffer(), f.type);
    return url ? NextResponse.json({ ok: true, url }) : NextResponse.json({ ok: false, error: "Use a JPG, PNG or WebP under 8 MB." }, { status: 400 });
  }

  if (b.op === "list") return NextResponse.json({ ok: true, items: list.filter((c) => c.account === account.id && (!b.sku || c.sku === b.sku)).slice(-40).reverse() });

  const sku = String(b.sku ?? "").trim();
  const kind: CreativeKind = b.kind === "aplus" ? "aplus" : "listing";

  if (b.op === "plan") {
    if (!sku) return NextResponse.json({ ok: false, error: "Which product?" }, { status: 400 });
    if (!(await spend(store, ws, "imagePlans", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.imagePlans }, { status: 429 });
    const l = (await fetchListings(account.id, [sku])).listings[0];
    if (!l) return NextResponse.json({ ok: false, error: "Couldn't read this listing from Amazon right now." });
    const all = ((await store.listSnapshots(ws.id, { brand: account.name, kind: "sp_search_term", limit: 1 }))[0]?.extra?.terms ?? []) as TermLite[];
    // This product's own selling searches only (exact, through its ad groups); none rather than another product's.
    const terms = termsForProduct(all, [sku, l.asin ?? ""], await adGroupMap(store, ws, account.id)).terms;
    const concepts = await planCreatives(l, terms, kind, b.note);
    if (!concepts) return NextResponse.json({ ok: false, error: "Rocco couldn't plan images from this listing. Add a few more bullets and try again." });
    trackServer(ws.id, "images_planned", { kind, n: concepts.length });
    return NextResponse.json({ ok: true, concepts, photos: l.images ?? [], productType: l.productType, asin: l.asin });
  }

  if (b.op === "render") {
    const c = b.concept;
    if (!sku || !c) return NextResponse.json({ ok: false, error: "Missing the product or image idea." }, { status: 400 });
    const problem = promptProblems(String(c.prompt ?? ""));
    if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 400 });
    const refs = (b.refs ?? []).filter((u) => /^https:\/\//.test(String(u))).slice(0, 3);
    if (!refs.length) return NextResponse.json({ ok: false, error: "Pick or upload a photo of the product first." }, { status: 400 });
    if (!(await spend(store, ws, "images", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.images }, { status: 429 });
    const aspect = (ASPECTS as readonly string[]).includes(String(c.aspect)) ? (c.aspect as Aspect) : "1:1";
    const concept: Concept = { slot: String(c.slot ?? "2").slice(0, 20), title: String(c.title ?? "").slice(0, 60), why: String(c.why ?? "").slice(0, 240), prompt: String(c.prompt).slice(0, 1500), negative: String(c.negative ?? "").slice(0, 900), aspect };
    const rec = newCreative({ account: account.id, sku, kind, by, concept });
    const r = await submitImage({ prompt: concept.prompt, negative: concept.negative, refs, aspect, key: `rocco-${rec.id}` });
    Object.assign(rec, { requestId: r.requestId, status: r.status === "failed" || r.status === "nsfw" ? "failed" : r.images.length ? "ready" : "rendering", images: r.images, ...(r.error ? { error: r.error } : {}) });
    list.push(rec); ws.amazon!.creatives = list.slice(-200); await save();
    trackServer(ws.id, "image_render", { kind, ok: rec.status !== "failed" });
    return NextResponse.json({ ok: rec.status !== "failed", item: rec, error: rec.error });
  }

  const rec = list.find((c) => c.id === b.id && c.account === account.id);
  if (!rec) return NextResponse.json({ ok: false, error: "That image isn't here any more." }, { status: 404 });

  if (b.op === "status") {
    if (rec.status === "rendering" && rec.requestId) {
      const r = await imageStatus(rec.requestId);
      if (r.status === "completed") Object.assign(rec, { status: "ready", images: r.images });
      else if (r.status === "failed" || r.status === "nsfw" || r.status === "canceled") Object.assign(rec, { status: "failed", error: r.error ?? "Generation failed." });
      if (rec.status !== "rendering") await save();
    }
    return NextResponse.json({ ok: true, item: rec });
  }

  if (b.op === "use") {
    const url = String(b.url ?? "");
    const slot = Math.round(Number(b.slot));
    if (rec.kind !== "listing") return NextResponse.json({ ok: false, error: "A+ images go in through A+ Content Manager: download it and add it there." }, { status: 400 });
    if (!rec.images.includes(url) || !(slot >= 2 && slot <= 8)) return NextResponse.json({ ok: false, error: "Pick one of the images and a slot from 2 to 8." }, { status: 400 });
    if (!(await spend(store, ws, "writes", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.writes }, { status: 429 });
    const l = (await fetchListings(account.id, [rec.sku])).listings[0];
    if (!l?.productType) return NextResponse.json({ ok: false, error: "Couldn't read this listing's product type from Amazon, so nothing was changed." });
    const res = await verifiedWrite(account.id, imageSlotBody(rec.sku, l.productType, account.country, slot, url), `rocco:${ws.id}:img:${rec.id}:${slot}`);
    if (res.ok) { Object.assign(rec, { status: "used", usedSlot: slot, usedUrl: url, usedAt: new Date().toISOString() }); await save(); }
    trackServer(ws.id, "image_used", { ok: res.ok });
    return NextResponse.json({ ok: res.ok, item: rec, warnings: res.warnings, error: res.error, previous: l.images?.[slot - 1] ?? null });
  }

  return NextResponse.json({ ok: false, error: "Unknown request." }, { status: 400 });
}
