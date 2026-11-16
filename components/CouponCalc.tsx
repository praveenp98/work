"use client";
import { useMemo, useState } from "react";
import { couponMath } from "@/lib/rules/coupon";

export function CouponCalc() {
  const [v, setV] = useState({ price: 39.99, discountType: "pct" as "pct" | "amt", discount: 20, cogs: 9, referralPct: 15, fbaFee: 6.5, adCostPerUnit: 3, couponFeePct: 2.5, couponFixedFee: 5, units: 300 });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: k === "discountType" ? e.target.value : Number(e.target.value) });
  const m = useMemo(() => couponMath(v), [v]);
  const $ = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(n).toFixed(2)}`;
  return (
    <div className="tool">
      <div className="row">
        <label className="f">Price ($)<input type="number" step="0.01" value={v.price} onChange={set("price")} /></label>
        <label className="f">Coupon type<select value={v.discountType} onChange={set("discountType")}><option value="pct">% off</option><option value="amt">$ off</option></select></label>
        <label className="f">Coupon value<input type="number" step="0.01" value={v.discount} onChange={set("discount")} /></label>
        <label className="f">Units you expect to sell with it<input type="number" value={v.units} onChange={set("units")} /></label>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <label className="f">Product cost incl. shipping in ($)<input type="number" step="0.01" value={v.cogs} onChange={set("cogs")} /></label>
        <label className="f">Referral fee (%)<input type="number" step="0.1" value={v.referralPct} onChange={set("referralPct")} /></label>
        <label className="f">FBA fee per unit ($)<input type="number" step="0.01" value={v.fbaFee} onChange={set("fbaFee")} /></label>
        <label className="f">Ad cost per unit ($)<input type="number" step="0.01" value={v.adCostPerUnit} onChange={set("adCostPerUnit")} /></label>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <label className="f">Coupon performance fee (% of coupon sales)<input type="number" step="0.1" value={v.couponFeePct} onChange={set("couponFeePct")} /></label>
        <label className="f">Fixed coupon fee ($ per coupon)<input type="number" step="0.01" value={v.couponFixedFee} onChange={set("couponFixedFee")} /></label>
      </div>
      <p className="fine" style={{ marginTop: 8 }}>Amazon changes coupon and FBA fees from time to time. Check the current numbers in Seller Central and edit them above.</p>

      <div className="stats" style={{ marginTop: 16 }}>
        <div className="stat"><b>{$(m.salePrice)}</b><span>price after coupon</span></div>
        <div className="stat"><b>{$(m.profitBefore)}</b><span>profit/unit without coupon</span></div>
        <div className="stat"><b className={m.profitAfter < 0 ? "warn" : ""}>{$(m.profitAfter)}</b><span>profit/unit with coupon</span></div>
        <div className="stat"><b className={m.marginAfter < 0 ? "warn" : ""}>{(m.marginAfter * 100).toFixed(1)}%</b><span>margin with coupon</span></div>
        <div className="stat"><b className={m.totalProfit < 0 ? "warn" : ""}>{$(m.totalProfit)}</b><span>total profit on {v.units} units</span></div>
        <div className="stat"><b>{m.maxSafePct.toFixed(0)}%</b><span>deepest coupon before you lose money</span></div>
      </div>
      <p style={{ fontWeight: 650 }}>
        {m.profitAfter < 0
          ? `Rocco says: this coupon loses ${$(-m.profitAfter)} on every sale. That's not a deal, that's a donation.`
          : m.unitsToMatch !== null
            ? `Rocco says: you need ${m.unitsToMatch.toLocaleString("en-US")} coupon sales to make what ${v.units.toLocaleString("en-US")} full-price sales would. Worth it only if the coupon really lifts volume that much.`
            : "Rocco says: looks safe."}
      </p>
    </div>
  );
}
