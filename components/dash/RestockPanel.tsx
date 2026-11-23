"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { LoadingText } from "@/components/LoadingText";
import type { JobItem } from "@/lib/jobs";
import type { Owner, ShipFrom } from "@/lib/restock";

export interface RestockCtx {
  token: string;
  account: string;
  country: string;
  from?: ShipFrom;
  sendUrl: string;
  recent?: { id: string; at: string; status: "created" | "pending" | "cancelled"; items: { sku: string; qty: number }[]; name: string; by?: string }[];
}

const post = (body: object) => fetch("/api/w/restock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => ({ ok: false, error: "No connection. Try again." }));
const LABEL: { id: Owner; t: string }[] = [{ id: "SELLER", t: "I put Amazon barcodes on" }, { id: "NONE", t: "Manufacturer barcode (no label)" }, { id: "AMAZON", t: "Amazon labels them (fee)" }];
const PREP: { id: Owner; t: string }[] = [{ id: "NONE", t: "No prep needed" }, { id: "SELLER", t: "I prep them" }, { id: "AMAZON", t: "Amazon preps (fee)" }];

/**
 * Restock in one tap: quantities (pre-filled at ~60 days of cover, editable) → Create the plan in Amazon.
 * First time only: the ship-from address and who labels/preps. Boxes, carrier and labels stay in Send to Amazon.
 */
export function RestockPanel({ ctx, items }: { ctx: RestockCtx; items: JobItem[] }) {
  const rows = items.filter((i) => i.sku);
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(rows.map((r) => [r.sku!, r.qty ?? 0])));
  const [from, setFrom] = useState<Partial<ShipFrom>>(ctx.from ?? { countryCode: ctx.country, labelOwner: "SELLER", prepOwner: "NONE" });
  const [editing, setEditing] = useState(!ctx.from);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [plan, setPlan] = useState(ctx.recent?.find((r) => r.status !== "cancelled" && r.items.some((i) => rows.some((x) => x.sku === i.sku))));

  const total = Object.values(qty).reduce((t, n) => t + (n > 0 ? n : 0), 0);
  const set = (k: keyof ShipFrom) => (e: React.ChangeEvent<HTMLInputElement>) => setFrom((f) => ({ ...f, [k]: e.target.value }));

  async function create() {
    setBusy(true); setErr("");
    track("job_approved", { kind: "restock", changes: rows.length, mode: "restock" });
    const d = await post({ t: ctx.token, account: ctx.account, items: rows.map((r) => ({ sku: r.sku, qty: qty[r.sku!] ?? 0 })), ...(editing ? { address: from } : {}) });
    setBusy(false);
    if (d.needAddress) { setEditing(true); setErr(d.error); return; }
    if (d.restock) { setPlan(d.restock); if (!d.ok) setErr(d.error ?? ""); return; }
    setErr(d.error ?? "Something went wrong. Nothing was created.");
  }
  async function act(kind: "check" | "cancel") {
    if (!plan) return;
    if (kind === "cancel" && !confirm("Cancel this plan in Amazon? Nothing has shipped yet.")) return;
    setBusy(true); setErr("");
    const d = await post({ t: ctx.token, [kind]: plan.id });
    setBusy(false);
    if (d.restock) setPlan(d.restock); else { setErr(d.error ?? "Try again."); if (kind === "check") setPlan(undefined); }
  }

  if (plan && plan.status !== "cancelled") {
    return (
      <div className="rs-done">
        {plan.status === "pending" ? (
          <><p><b>Amazon is still creating your plan.</b> It can take a few minutes. Nothing to redo.</p>
          <button className="btn ghost small" disabled={busy} onClick={() => act("check")}>Check again</button></>
        ) : (
          <><p><span className="rd-tick" aria-hidden>✓</span> <b>Plan created in Amazon</b>: “{plan.name}”, {plan.items.reduce((t, i) => t + i.qty, 0)} units{plan.by ? `, by ${plan.by}` : ""}.</p>
          <p className="fine">Next, in Seller Central (about 5 minutes): box contents and weights, carrier, then print labels. Amazon shows any fees before you confirm.</p>
          <div className="tw-act"><a className="btn" href={ctx.sendUrl} target="_blank" rel="noreferrer">Finish in Send to Amazon →</a>
          <button className="linkbtn muted" disabled={busy} onClick={() => act("cancel")}>Cancel plan</button></div></>
        )}
        {err && <p className="err" role="alert">{err}</p>}
      </div>
    );
  }

  return (
    <div className="rs">
      <ul className="rs-items">
        {rows.map((r) => (
          <li key={r.sku}>
            <span className="ji-l">{r.label.replace(/: ~\d+ days of stock left$/, "")}<small> · {r.sku}</small></span>
            <label className="rs-q"><input type="number" inputMode="numeric" min={0} max={10000} step={1} value={qty[r.sku!] ?? 0} onChange={(e) => setQty((q) => ({ ...q, [r.sku!]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))} aria-label={`Units of ${r.sku}`} /> units</label>
          </li>
        ))}
      </ul>
      <p className="fine">Pre-filled for ~60 days of sales. Already have a shipment on the way? Lower these. 0 skips a product.</p>

      {editing ? (
        <fieldset className="rs-from">
          <legend>Ships from (saved for next time)</legend>
          <input placeholder="Contact name" value={from.name ?? ""} onChange={set("name")} autoComplete="name" />
          <input placeholder="Company (optional)" value={from.companyName ?? ""} onChange={set("companyName")} autoComplete="organization" />
          <input placeholder="Street address" value={from.addressLine1 ?? ""} onChange={set("addressLine1")} autoComplete="address-line1" />
          <input placeholder="Unit, suite (optional)" value={from.addressLine2 ?? ""} onChange={set("addressLine2")} autoComplete="address-line2" />
          <div className="rs-row"><input placeholder="City" value={from.city ?? ""} onChange={set("city")} autoComplete="address-level2" /><input placeholder="State (e.g. CA)" value={from.stateOrProvinceCode ?? ""} onChange={set("stateOrProvinceCode")} autoComplete="address-level1" /></div>
          <div className="rs-row"><input placeholder="Postal code" value={from.postalCode ?? ""} onChange={set("postalCode")} autoComplete="postal-code" /><input placeholder="Country (US)" maxLength={2} value={from.countryCode ?? ""} onChange={set("countryCode")} autoComplete="country" /></div>
          <input placeholder="Phone (+1 555…)" value={from.phoneNumber ?? ""} onChange={set("phoneNumber")} autoComplete="tel" inputMode="tel" />
          <label>Barcodes<select value={from.labelOwner ?? "SELLER"} onChange={(e) => setFrom((f) => ({ ...f, labelOwner: e.target.value as Owner }))}>{LABEL.map((o) => <option key={o.id} value={o.id}>{o.t}</option>)}</select></label>
          <label>Prep<select value={from.prepOwner ?? "NONE"} onChange={(e) => setFrom((f) => ({ ...f, prepOwner: e.target.value as Owner }))}>{PREP.map((o) => <option key={o.id} value={o.id}>{o.t}</option>)}</select></label>
        </fieldset>
      ) : (
        <p className="fine">Ships from {from.addressLine1}, {from.city} · <button className="linkbtn" onClick={() => setEditing(true)}>change</button></p>
      )}

      {busy ? <LoadingText steps={["Checking the plan with Amazon first…", "Creating the shipment plan in Amazon…", "Waiting for Amazon to confirm…"]} every={5000} />
        : <div className="tw-act"><button className="btn" disabled={!total} onClick={create}>Create shipment plan · {total} units</button></div>}
      <p className="fine">Nothing ships and no fees are charged until you confirm boxes and carrier in Seller Central. You can cancel the plan here until then.</p>
      {err && <p className="err" role="alert">{err}</p>}
    </div>
  );
}
