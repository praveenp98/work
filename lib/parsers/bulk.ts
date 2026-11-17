import { normHeader, toNumber } from "./normalize";

/** IDs from a Sponsored Products bulk file export (Bulksheets 2.0), keyed by names. */
export interface BulkIndex {
  campaigns: Map<string, string>; // campaign name → campaign id
  adGroups: Map<string, string>; // campaign \u0001 ad group → ad group id
  keywords: Map<string, { id: string; bid: number }>; // campaign \u0001 ad group \u0001 text \u0001 match → keyword id
  targets: Map<string, { id: string; bid: number }>; // campaign \u0001 ad group \u0001 expression → target id
}

export const k = (...parts: string[]) => parts.map((p) => p.trim().toLowerCase()).join("\u0001");

const COLS = {
  entity: ["entity"],
  campaignId: ["campaign id"],
  adGroupId: ["ad group id"],
  keywordId: ["keyword id"],
  targetId: ["product targeting id"],
  campaignName: ["campaign name informational only", "campaign name"],
  adGroupName: ["ad group name informational only", "ad group name"],
  keywordText: ["keyword text"],
  matchType: ["match type"],
  expression: ["product targeting expression", "resolved product targeting expression informational only"],
  bid: ["bid"],
};

export function isBulkSheet(header: unknown[]): boolean {
  const n = header.map(normHeader);
  return n.includes("entity") && n.includes("campaign id");
}

export function parseBulk(table: unknown[][]): BulkIndex {
  const hi = table.findIndex((r) => isBulkSheet(r ?? []));
  if (hi < 0) throw new Error("This isn't a Sponsored Products bulk file (needs Entity and Campaign ID columns).");
  const n = table[hi].map(normHeader);
  const col = (names: string[]) => names.map((x) => n.indexOf(x)).find((i) => i >= 0) ?? -1;
  const c = Object.fromEntries(Object.entries(COLS).map(([key, v]) => [key, col(v)])) as Record<keyof typeof COLS, number>;
  const g = (r: unknown[], i: number) => (i < 0 ? "" : String(r[i] ?? "").trim());

  const idx: BulkIndex = { campaigns: new Map(), adGroups: new Map(), keywords: new Map(), targets: new Map() };
  const campNameById = new Map<string, string>();
  const agNameById = new Map<string, string>();
  const rows = table.slice(hi + 1);
  for (const r of rows) {
    const e = g(r, c.entity).toLowerCase();
    if (e === "campaign") {
      campNameById.set(g(r, c.campaignId), g(r, c.campaignName));
      idx.campaigns.set(k(g(r, c.campaignName)), g(r, c.campaignId));
    }
  }
  for (const r of rows) {
    const e = g(r, c.entity).toLowerCase();
    if (e === "ad group") {
      const camp = g(r, c.campaignName) || campNameById.get(g(r, c.campaignId)) || "";
      agNameById.set(g(r, c.adGroupId), g(r, c.adGroupName));
      idx.adGroups.set(k(camp, g(r, c.adGroupName)), g(r, c.adGroupId));
    }
  }
  for (const r of rows) {
    const e = g(r, c.entity).toLowerCase();
    const camp = g(r, c.campaignName) || campNameById.get(g(r, c.campaignId)) || "";
    const ag = g(r, c.adGroupName) || agNameById.get(g(r, c.adGroupId)) || "";
    if (e === "keyword") idx.keywords.set(k(camp, ag, g(r, c.keywordText), g(r, c.matchType)), { id: g(r, c.keywordId), bid: toNumber(g(r, c.bid)) });
    if (e === "product targeting") idx.targets.set(k(camp, ag, g(r, c.expression)), { id: g(r, c.targetId), bid: toNumber(g(r, c.bid)) });
  }
  return idx;
}

/** Flat rows from a bulk file, for structure audits. */
export interface BulkRow {
  entity: string; // campaign | ad group | keyword | negative keyword | campaign negative keyword | product targeting | negative product targeting | ...
  campaign: string;
  adGroup: string;
  state: string;
  targetingType: string; // auto | manual (campaign rows)
  budget: number;
  bid: number;
  keyword: string;
  matchType: string;
  expression: string;
}

export function parseBulkRows(table: unknown[][]): BulkRow[] {
  const hi = table.findIndex((r) => isBulkSheet(r ?? []));
  if (hi < 0) throw new Error("This isn't a Sponsored Products bulk file (needs Entity and Campaign ID columns).");
  const n = table[hi].map(normHeader);
  const col = (...names: string[]) => names.map((x) => n.indexOf(x)).find((i) => i >= 0) ?? -1;
  const c = {
    entity: col("entity"), campaignId: col("campaign id"), adGroupId: col("ad group id"),
    campaign: col("campaign name informational only", "campaign name"), adGroup: col("ad group name informational only", "ad group name"),
    state: col("state"), targetingType: col("targeting type"), budget: col("daily budget", "budget"), bid: col("bid"),
    keyword: col("keyword text"), matchType: col("match type"), expression: col("product targeting expression"),
  };
  const g = (r: unknown[], i: number) => (i < 0 ? "" : String(r[i] ?? "").trim());
  const campName = new Map<string, string>();
  const agName = new Map<string, string>();
  const body = table.slice(hi + 1);
  for (const r of body) {
    const e = g(r, c.entity).toLowerCase();
    if (e === "campaign") campName.set(g(r, c.campaignId), g(r, c.campaign));
    if (e === "ad group") agName.set(g(r, c.adGroupId), g(r, c.adGroup));
  }
  return body
    .filter((r) => g(r, c.entity))
    .map((r) => ({
      entity: g(r, c.entity).toLowerCase(),
      campaign: g(r, c.campaign) || campName.get(g(r, c.campaignId)) || "",
      adGroup: g(r, c.adGroup) || agName.get(g(r, c.adGroupId)) || "",
      state: g(r, c.state).toLowerCase(),
      targetingType: g(r, c.targetingType).toLowerCase(),
      budget: toNumber(g(r, c.budget)),
      bid: toNumber(g(r, c.bid)),
      keyword: g(r, c.keyword).toLowerCase(),
      matchType: g(r, c.matchType).toLowerCase(),
      expression: g(r, c.expression).toLowerCase(),
    }));
}
