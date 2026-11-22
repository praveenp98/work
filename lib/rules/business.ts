import type { BusinessRow } from "../parsers/business";
import { r2, type Analysis, type Finding } from "./types";

/**
 * Business Report analysis: conversion by ASIN, buy box, and TACoS when ad spend is known.
 * Flags ASINs that get traffic but don't convert (fix the listing before buying more clicks).
 */
export function analyzeBusiness(rows: BusinessRow[], opts: { adSpend?: number; adSales?: number; days?: number } = {}): Analysis {
  const sessions = rows.reduce((a, r) => a + r.sessions, 0);
  const units = rows.reduce((a, r) => a + r.units, 0);
  const sales = rows.reduce((a, r) => a + r.sales, 0);
  const avgCvr = sessions > 0 ? units / sessions : 0;
  const days = opts.days ?? 30;
  const findings: Finding[] = [];

  for (const r of rows) {
    const cvr = r.sessions > 0 ? r.units / r.sessions : 0;
    if (r.sessions >= 500 && cvr < avgCvr * 0.5) {
      const missedUnits = r.sessions * (avgCvr * 0.75 - cvr);
      const price = r.units > 0 ? r.sales / r.units : 0;
      findings.push({
        severity: "high",
        title: `${r.asin} gets traffic but doesn't convert`,
        detail: `${r.sessions.toLocaleString("en-US")} sessions at ${(cvr * 100).toFixed(1)}% conversion vs your ${(avgCvr * 100).toFixed(1)}% average. Fix price, main image, title or reviews before buying more clicks for it.`,
        line: `${r.title || r.asin} is getting visitors and sending them home empty-handed.`,
        valueMonthly: r2(Math.max(0, missedUnits * price) * (30 / days)),
      });
    }
    if (r.buyBoxPct >= 0 && r.buyBoxPct < 90 && r.sessions >= 100) {
      findings.push({
        severity: "high",
        title: `${r.asin} only wins the buy box ${r.buyBoxPct}% of the time`,
        detail: "Ads for an offer that doesn't hold the buy box often pay for someone else's sale. Check for other sellers, price and stock before spending more.",
        line: `Your ads are warming up shoppers for someone else's buy box.`,
        valueMonthly: 0,
      });
    }
  }
  const top = [...rows].sort((a, b) => b.sales - a.sales)[0];
  if (top) findings.push({ severity: "win", title: `Best seller: ${top.title || top.asin}`, detail: `${top.units} units, ${(top.sessions ? (top.units / top.sessions) * 100 : 0).toFixed(1)}% conversion.`, valueMonthly: 0 });

  const lowBb = rows.filter((r) => r.buyBoxPct >= 0 && r.buyBoxPct < 90 && r.sessions >= 100).sort((a, b) => a.buyBoxPct - b.buyBoxPct);
  const stats: Record<string, number | string> = { sessions, units, sales: r2(sales), conversionPct: r2(avgCvr * 100), asins: rows.length, buyBoxLow: lowBb.length, ...(lowBb[0] ? { buyBoxWorst: `${lowBb[0].asin} at ${lowBb[0].buyBoxPct}%` } : {}) };
  let headline = `${rows.length} ASINs · ${sessions.toLocaleString("en-US")} sessions · ${(avgCvr * 100).toFixed(1)}% conversion · $${Math.round(sales).toLocaleString("en-US")} sales.`;
  // Ad-attributed sales above total sales means this sales report covers less time than the ads data (e.g. history
  // still loading): skip TACoS rather than show a wrong one.
  if (opts.adSales && opts.adSales > sales * 1.05) stats.salesIncomplete = 1;
  else if (opts.adSpend && sales > 0) {
    const tacos = opts.adSpend / sales;
    stats.tacosPct = r2(tacos * 100);
    if (opts.adSales) stats.adShareOfSalesPct = r2((opts.adSales / sales) * 100);
    headline += ` TACoS ${(tacos * 100).toFixed(1)}%${opts.adSales ? `, ads drive ${((opts.adSales / sales) * 100).toFixed(0)}% of sales` : ""}.`;
    if (tacos > 0.15) findings.push({ severity: "medium", title: `TACoS is ${(tacos * 100).toFixed(1)}%`, detail: "Ads are a big share of total revenue. Healthy accounts usually bring TACoS down over time as organic rank grows.", valueMonthly: 0 });
  }
  findings.sort((a, b) => rank(a) - rank(b) || b.valueMonthly - a.valueMonthly);
  return { reportType: "business_report", headline, findings, proposals: [], stats };
}

const rank = (f: Finding) => ({ high: 0, medium: 1, low: 2, win: 3 })[f.severity];
