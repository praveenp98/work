import Papa from "papaparse";
import { exportCsv, findSource } from "/home/user/work/lib/datadoe-sync";
import { runAction } from "/home/user/work/lib/datadoe";
const A="7d366457-344a-47fd-89ca-a1a5438584fe";
const P:any = { kind: "sp_campaign", table: "amazon_ads_ads_raw", query: "ads raw", days: 1, shape: "daily", cols: { ad_id:"_id", ad_group_id: "_g", ad_campaign_id:"_c", ad_campaign_type: "_t", ad_state: "_s", ad_creative_products: "_p" } };
const src:any = await findSource(A, P); console.log("cols:", src.columns.map((c:any)=>c.name).filter((n:string)=>/^ad_/.test(n)).join(","));
const rows = Papa.parse<Record<string, any>>(await exportCsv(A, src, P), { header: true, skipEmptyLines: true }).data;
const mine = rows.filter(r => /SPONSORED_PRODUCTS/.test(r.ad_campaign_type) && String(r.ad_creative_products).includes("BSJ Vol 1"));
console.log("BSJ SP ads:", mine.length, "enabled:", mine.filter(r=>/ENABLED/.test(r.ad_state)).length, JSON.stringify(mine[0]).slice(0,300));
const ad = mine.find(r=>/ENABLED/.test(r.ad_state)) ?? mine[0];
for (const details of [{ ads: [{ adId: ad.ad_id, adProduct: "SPONSORED_PRODUCTS", state: "PAUSED" }] }]) {
  const r = await runAction(A, "AMAZON_ADS_ADS_UPDATE", details, { dryRun: true }); console.log("dry:", JSON.stringify(r).slice(0,300));
}
