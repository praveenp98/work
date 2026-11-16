"use client";
import { useMemo, useState } from "react";
import { breakevenAcos } from "@/lib/rules/coupon";

export function BreakevenCalc() {
  const [v, setV] = useState({ price: 29.99, cogs: 7, referralPct: 15, fbaFee: 5.5, otherCosts: 0.5, targetProfitPct: 10, conversionRate: 10 });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: Number(e.target.value) });
  const b = useMemo(() => breakevenAcos(v), [v]);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  return (
    <div className="tool">
      <div className="row">
        <label className="f">Price ($)<input type="number" step="0.01" value={v.price} onChange={set("price")} /></label>
        <label className="f">Product cost incl. inbound shipping ($)<input type="number" step="0.01" value={v.cogs} onChange={set("cogs")} /></label>
        <label className="f">Referral fee (%)<input type="number" step="0.1" value={v.referralPct} onChange={set("referralPct")} /></label>
        <label className="f">FBA fee ($)<input type="number" step="0.01" value={v.fbaFee} onChange={set("fbaFee")} /></label>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <label className="f">Other costs per unit ($)<input type="number" step="0.01" value={v.otherCosts} onChange={set("otherCosts")} /></label>
        <label className="f">Profit you want to keep (% of price)<input type="number" step="1" value={v.targetProfitPct} onChange={set("targetProfitPct")} /></label>
        <label className="f">Conversion rate (%)<input type="number" step="0.5" value={v.conversionRate} onChange={set("conversionRate")} /></label>
      </div>
      <div className="stats" style={{ marginTop: 16 }}>
        <div className="stat"><b className={b.breakeven <= 0 ? "warn" : ""}>{pct(b.breakeven)}</b><span>breakeven ACoS</span></div>
        <div className="stat"><b>{pct(b.target)}</b><span>target ACoS (keeps {v.targetProfitPct}% profit)</span></div>
        <div className="stat"><b>${b.profitBeforeAds.toFixed(2)}</b><span>profit per unit before ads</span></div>
        <div className="stat"><b>${b.maxCpcBreakeven.toFixed(2)}</b><span>max CPC at breakeven</span></div>
        <div className="stat"><b>${b.maxCpcTarget.toFixed(2)}</b><span>max CPC at target</span></div>
      </div>
      <p style={{ fontWeight: 650 }}>
        {b.breakeven <= 0 ? "Rocco says: you lose money on every sale before ads even start. Fix price or costs first." : `Rocco says: any search term above ${pct(b.breakeven)} ACoS is costing you money. Use ${pct(b.target)} as your target in the Ad Roast.`}
      </p>
    </div>
  );
}
