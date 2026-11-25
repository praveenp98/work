import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { aplusProblems, canAplus, draftAplus, hasAplus, newAplus, submitAplus, type AplusDraft } from "@/lib/aplus";
import { currencyOf } from "@/lib/currency";
import { datadoeOn, missingCogs, upsertCogs } from "@/lib/datadoe";
import { allow } from "@/lib/human";
import { adGroupMap, termsForProduct } from "@/lib/term-products";
import { attributeBody, checkCopy, fetchListings, isSuppressed, keywordPlan, newEdit, updateBody, verifiedWrite, type Listing } from "@/lib/listings";
import { cogsRows } from "@/lib/profit";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { approvedBy } from "@/lib/team";
import { trackServer } from "@/lib/track-server";
import { brandSettings, loadWorkspace } from "@/lib/workspace";
import type { TermLite } from "@/lib/rules/terms";

/**
 * Products: profit per product + listing work, for one connected Amazon account.
 *  { t, account, op: "cogs", items: [{ sku, asin?, cost, shipping }] }   save product costs to DataDoe
 *  { t, account, op: "missing" }                                         products sold without a cost yet
 *  { t, account, op: "listing", sku }                                    live listing + keyword plan + issues + A+ status
 *  { t, account, op: "keywords"|"title"|"bullets", sku, value }          verified write, old value saved for undo
 *  { t, account, op: "attribute", sku, productType, attribute, value }   fix one Amazon listing issue
 *  { t, account, op: "undo", edit }                                      put the old value back
 *  { t, account, op: "aplus_draft", sku } · { op: "aplus_submit", sku, asin, draft }
 */
export const maxDuration = 180;

type Body = { t?: string; account?: string; op?: string; sku?: string; asin?: string; value?: unknown; items?: unknown; productType?: string; attribute?: string; edit?: string; draft?: AplusDraft };

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Body;
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  if (!store || !ws) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to work on your listings." }, { status: 402 });
  if (!datadoeOn()) return NextResponse.json({ ok: false, error: "Connect Amazon first." }, { status: 400 });
  const account = ws.amazon?.accounts?.find((a) => a.id === b.account);
  if (!account) return NextResponse.json({ ok: false, error: "Pick an Amazon account." }, { status: 400 });
  if (!allow(`products:${ws.id}`, 60, 10 * 60_000)) return NextResponse.json({ ok: false, error: "That's a lot of requests. Give it a minute." }, { status: 429 });
  const by = (await approvedBy(ws)).replace(" · approved by ", "") || "the owner";
  const save = async () => store.saveWorkspace(ws);

  // ---- profit: product costs ----
  if (b.op === "missing") {
    const m = await missingCogs(account.id).catch(() => null);
    return NextResponse.json({ ok: !!m, missing: m?.items ?? [], count: m?.missingItemsCount ?? 0 });
  }
  if (b.op === "cogs") {
    const items = (Array.isArray(b.items) ? b.items : []).map((x) => x as { sku?: unknown; asin?: unknown; cost?: unknown; shipping?: unknown }).map((x) => ({ sku: String(x.sku ?? "").trim().slice(0, 64), asin: x.asin ? String(x.asin).slice(0, 10) : undefined, cost: Number(x.cost), shipping: Number(x.shipping ?? 0) || 0 }));
    // Effective 180 days back so the profit already shown gets restated with the real cost.
    const rows = cogsRows(items, currencyOf(account.country).code, new Date(Date.now() - 180 * 86_400_000).toISOString().slice(0, 10));
    if (!rows.length) return NextResponse.json({ ok: false, error: "Enter a cost per unit for at least one product." }, { status: 400 });
    try {
      const r = await upsertCogs(account.id, rows);
      trackServer(ws.id, "cogs_saved", { products: rows.length });
      return NextResponse.json({ ok: true, saved: r.upsertedCount ?? rows.length });
    } catch (e) {
      return NextResponse.json({ ok: false, error: `DataDoe didn't take the costs: ${e instanceof Error ? e.message.slice(0, 160) : "try again"}` }, { status: 502 });
    }
  }

  const sku = String(b.sku ?? "").trim();
  const terms = ((await store.listSnapshots(ws.id, { brand: account.name, kind: "sp_search_term", limit: 1 }))[0]?.extra?.terms ?? []) as TermLite[];
  const settings = brandSettings(ws, account.name);
  const never = [...(settings.protectedTerms ?? []), ...(settings.protectedCampaigns ?? [])];

  if (b.op === "listing") {
    if (!sku) return NextResponse.json({ ok: false, error: "Which product?" }, { status: 400 });
    const r = await fetchListings(account.id, [sku]);
    const l = r.listings[0];
    if (!l) return NextResponse.json({ ok: false, error: r.error ?? "Amazon didn't return this listing." });
    // Only searches that sold through ad groups advertising this exact product (lib/term-products.ts).
    const mine = termsForProduct(terms, [sku, l.asin ?? ""], await adGroupMap(store, ws, account.id));
    const aplus = canAplus(account.country) && l.asin ? await hasAplus(account.id, l.asin) : null;
    return NextResponse.json({ ok: true, listing: l, plan: { ...keywordPlan(l, mine.terms, never), shared: mine.shared, linked: mine.linked }, suppressed: isSuppressed(l), aplus: { possible: canAplus(account.country), has: aplus }, edits: (ws.amazon?.listingEdits ?? []).filter((e) => e.sku === sku && e.account === account.id).slice(-10) });
  }

  if (b.op === "keywords" || b.op === "title" || b.op === "bullets" || b.op === "attribute") {
    if (!sku) return NextResponse.json({ ok: false, error: "Which product?" }, { status: 400 });
    if (!(await spend(store, ws, "writes", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.writes }, { status: 429 });
    const cur = (await fetchListings(account.id, [sku])).listings[0] as Listing | undefined;
    if (!cur) return NextResponse.json({ ok: false, error: "Couldn't read the listing from Amazon right now, so nothing was changed." });
    let before: string | string[], after: string | string[], write;
    if (b.op === "attribute") {
      const attr = String(b.attribute ?? "").slice(0, 64), value = String(b.value ?? "").trim().slice(0, 1000);
      if (!attr || !value || !(b.productType || cur.productType)) return NextResponse.json({ ok: false, error: "Fill in the value Amazon asked for." }, { status: 400 });
      before = ""; after = value;
      write = attributeBody(sku, String(b.productType || cur.productType), account.country, attr, value);
    } else {
      const field = b.op;
      after = field === "bullets" ? (Array.isArray(b.value) ? (b.value as unknown[]).map(String) : []) : String(b.value ?? "").trim();
      const problem = field === "keywords" ? (new TextEncoder().encode(String(after)).length > 249 ? "Backend search terms must stay under 250 bytes." : null) : checkCopy(field, after);
      if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 400 });
      before = field === "keywords" ? cur.keywords : field === "title" ? cur.title : cur.bullets;
      write = updateBody(sku, account.country, field, after);
    }
    const key = `rocco:${ws.id}:list:${sku}:${b.op}:${JSON.stringify(after).length}:${Date.now().toString(36)}`.slice(0, 120);
    const res = await verifiedWrite(account.id, write, key);
    const edit = newEdit({ account: account.id, sku, asin: cur.asin, by, field: b.op, attribute: b.op === "attribute" ? String(b.attribute) : undefined, productType: cur.productType, before, after, status: res.ok ? (res.pending ? "pending" : "applied") : "failed", actionId: res.actionId, error: res.error });
    if (res.ok) { ws.amazon = { ...(ws.amazon ?? { accounts: [] }), listingEdits: [...(ws.amazon?.listingEdits ?? []), edit].slice(-300) }; await save(); }
    trackServer(ws.id, "listing_edit", { field: b.op, ok: res.ok });
    return NextResponse.json({ ok: res.ok, edit, warnings: res.warnings, error: res.error });
  }

  if (b.op === "undo") {
    const e = ws.amazon?.listingEdits?.find((x) => x.id === b.edit && x.account === account.id);
    if (!e || e.status === "undone") return NextResponse.json({ ok: false, error: "Nothing to undo." }, { status: 400 });
    if (e.field === "attribute") return NextResponse.json({ ok: false, error: "Attribute fixes can't be reverted automatically. Change it back in Seller Central if you need to." }, { status: 400 });
    if (!(await spend(store, ws, "writes", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.writes }, { status: 429 });
    const res = await verifiedWrite(account.id, updateBody(e.sku, account.country, e.field as "keywords" | "title" | "bullets", e.before), `rocco:${ws.id}:undo:${e.id}`);
    if (res.ok) { e.status = "undone"; await save(); }
    return NextResponse.json({ ok: res.ok, error: res.error });
  }

  if (b.op === "aplus_draft") {
    const l = (await fetchListings(account.id, [sku])).listings[0];
    if (!l) return NextResponse.json({ ok: false, error: "Couldn't read the listing from Amazon." });
    if (!(await spend(store, ws, "ask", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.ask }, { status: 429 });
    const d = await draftAplus(l, terms);
    return d ? NextResponse.json({ ok: true, draft: d, problems: aplusProblems(d) }) : NextResponse.json({ ok: false, error: "Rocco couldn't write a clean draft from this listing. Add a few more bullets and try again." });
  }

  if (b.op === "aplus_submit") {
    const asin = String(b.asin ?? "");
    const d = b.draft;
    if (!d || !/^[A-Z0-9]{10}$/.test(asin)) return NextResponse.json({ ok: false, error: "Missing the draft or ASIN." }, { status: 400 });
    if (!canAplus(account.country)) return NextResponse.json({ ok: false, error: "A+ drafts are English-language stores only for now." }, { status: 400 });
    if ((await hasAplus(account.id, asin)) === true) return NextResponse.json({ ok: false, error: "This product already has A+ content. Rocco won't replace it." });
    if (!(await spend(store, ws, "writes", 1))) return NextResponse.json({ ok: false, error: LIMIT_MSG.writes }, { status: 429 });
    const res = await submitAplus(account.id, account.country, asin, d, `rocco:${ws.id}:aplus:${asin}:${new Date().toISOString().slice(0, 10)}`);
    const rec = newAplus({ account: account.id, asin, sku, by, draft: d, status: res.ok ? "submitted" : "failed", contentKey: res.contentKey, error: res.error });
    ws.amazon = { ...(ws.amazon ?? { accounts: [] }), aplus: [...(ws.amazon?.aplus ?? []), rec].slice(-100) };
    await save();
    trackServer(ws.id, "aplus_submitted", { ok: res.ok });
    return NextResponse.json({ ok: res.ok, error: res.error, record: rec });
  }

  return NextResponse.json({ ok: false, error: "Unknown request." }, { status: 400 });
}
