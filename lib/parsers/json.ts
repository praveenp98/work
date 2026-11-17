/**
 * Turn JSON rows from other connectors (Amazon Ads API v3 reports, SP-API reports, other Amazon tools)
 * into a header + rows table that Rocco's parsers already understand.
 * Nested objects are flattened; money objects like { amount, currencyCode } become the parent name.
 */
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

function flatten(o: Obj, out: Obj = {}, prefix = ""): Obj {
  for (const [k, v] of Object.entries(o)) {
    if (k === "currencyCode") { if (!("currency" in out)) out.currency = v; continue; }
    if (isObj(v)) {
      if ("amount" in v && Object.keys(v).every((x) => ["amount", "currencyCode"].includes(x))) {
        out[k] = v.amount;
        if (v.currencyCode && !("currency" in out)) out.currency = v.currencyCode;
      } else flatten(v, out, prefix ? `${prefix}.${k}` : k);
    } else if (!Array.isArray(v)) {
      out[k in out ? `${prefix}.${k}` : k] = v;
    } else if (/issue|message|reason|status/i.test(k) && v.length) {
      // Keep short lists that carry meaning (listing issues, status lists) as text: "Price is missing; …"
      out[k] = v.map((x) => (isObj(x) ? [x.severity, x.message ?? x.code].filter(Boolean).join(": ") : String(x))).join("; ");
    }
  }
  return out;
}

/** Find the main array of records in whatever a connector returned. */
export function findRecords(data: unknown): Obj[] | null {
  if (Array.isArray(data)) return data.filter(isObj).length ? (data.filter(isObj) as Obj[]) : null;
  if (!isObj(data)) return null;
  let best: Obj[] | null = null;
  for (const v of Object.values(data)) {
    const r = findRecords(v);
    if (r && (!best || r.length > best.length)) best = r;
  }
  return best;
}

export function recordsToTable(records: Obj[]): unknown[][] {
  const flat = records.map((r) => flatten(r));
  const header: string[] = [];
  for (const f of flat) for (const k of Object.keys(f)) if (!header.includes(k)) header.push(k);
  return [header, ...flat.map((f) => header.map((h) => f[h] ?? ""))];
}

/** Parse JSON text or a value into a table, or null if it holds no records. */
export function jsonToTable(input: string | unknown): unknown[][] | null {
  let data: unknown = input;
  if (typeof input === "string") {
    try { data = JSON.parse(input); } catch { return null; }
  }
  const recs = findRecords(data);
  return recs ? recordsToTable(recs) : null;
}
