import { OFFER } from "../../config/offer";
import { SAMPLE } from "../../config/sample";

/**
 * Specs are JSON, so they can't import the offer. Instead a spec writes {{offer:price.from}} or
 * {{sample:brand}} and the value is filled in from marketing/config at render time. A price typed into a spec
 * by hand would go stale if the price changed; a token can't.
 */
const ROOTS: Record<string, unknown> = { offer: OFFER, sample: SAMPLE };
const TOKEN = /\{\{(offer|sample):([a-zA-Z0-9_.]+)\}\}/g;

function lookup(root: string, path: string): string {
  let v: unknown = ROOTS[root];
  for (const key of path.split(".")) v = v !== null && typeof v === "object" ? (v as Record<string, unknown>)[key] : undefined;
  if (typeof v !== "string" && typeof v !== "number") throw new Error(`Spec token {{${root}:${path}}} does not exist in marketing/config/${root}.ts (or is not a string or number).`);
  return String(v);
}

export function expandTokens<T>(value: T): T {
  if (typeof value === "string") return value.replace(TOKEN, (_, root: string, path: string) => lookup(root, path)) as T;
  if (Array.isArray(value)) return value.map(expandTokens) as T;
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, expandTokens(v)])) as T;
  return value;
}
