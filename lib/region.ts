/**
 * Which version of Rocco a visitor sees (Nov 19, Praveen):
 *  - "us": Claude + Amazon's official connectors (the Selling Partner plugin is a US beta).
 *  - "intl": Amazon's scheduled report emails → Rocco's report inbox. No Claude needed.
 * Country from Vercel's x-vercel-ip-country header. A rocco_region cookie (set by /api/region?r=us|intl) overrides it,
 * so anyone can switch, and Praveen can test both from India.
 */
export type Region = "us" | "intl";
export const REGION_COOKIE = "rocco_region";

export function regionOf(h: Headers, cookieValue?: string | null): Region {
  if (cookieValue === "us" || cookieValue === "intl") return cookieValue;
  const c = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "").toUpperCase();
  if (!c) return "us"; // local dev / unknown
  return c === "US" ? "us" : "intl";
}

export const modeFor = (r: Region): "claude" | "reports" => (r === "us" ? "claude" : "reports");

export function regionFromRequest(req: Request): Region {
  const v = req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${REGION_COOKIE}=(us|intl)`))?.[1];
  return regionOf(req.headers, v);
}
