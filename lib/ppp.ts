/**
 * Local prices (Dodo purchasing power parity). Dodo charges each buyer in their own currency at a PPP-adjusted price;
 * the site's list price stays $1,190 / $119. To show the exact amount checkout will charge, Praveen copies Dodo's
 * local prices into the Vercel env var LOCAL_PRICES (JSON), e.g.
 *   {"IN":{"currency":"INR","symbol":"₹","annual":39900,"monthly":3990},"BR":{"currency":"BRL","symbol":"R$","annual":2990,"monthly":299}}
 * Countries not listed get a plain note ("checkout shows your price in your currency"). Every payment is compared
 * with this table (lib/billing.ts → price_mismatch event), so a stale entry shows up in PostHog the first day it's wrong.
 * docs/PRICING-MODEL.md → "Local prices".
 */
export interface LocalPrice { currency: string; symbol: string; annual: number; monthly: number }

export const NAMES: Record<string, string> = { IN: "India", BR: "Brazil", MX: "Mexico", TR: "Türkiye", EG: "Egypt", ZA: "South Africa", PK: "Pakistan", BD: "Bangladesh", ID: "Indonesia", PH: "the Philippines", VN: "Vietnam", NG: "Nigeria", GB: "the UK", DE: "Germany", FR: "France", IT: "Italy", ES: "Spain", CA: "Canada", AU: "Australia", JP: "Japan", AE: "the UAE", SA: "Saudi Arabia", PL: "Poland", NL: "the Netherlands", SE: "Sweden", SG: "Singapore" };

export function localPrices(): Record<string, LocalPrice> {
  try {
    const raw = JSON.parse(process.env.LOCAL_PRICES || "{}") as Record<string, Partial<LocalPrice>>;
    const out: Record<string, LocalPrice> = {};
    for (const [cc, p] of Object.entries(raw)) {
      if (/^[A-Z]{2}$/.test(cc) && p && typeof p.annual === "number" && typeof p.monthly === "number" && p.annual > 0 && p.monthly > 0 && p.currency)
        out[cc] = { currency: String(p.currency).toUpperCase(), symbol: String(p.symbol ?? `${p.currency} `), annual: p.annual, monthly: p.monthly };
    }
    return out;
  } catch { return {}; }
}

export const fmtLocal = (n: number, p: LocalPrice) => `${p.symbol}${Math.round(n).toLocaleString(p.currency === "INR" ? "en-IN" : "en-US")}`;

/** Does a paid amount match the table? null = no entry for that currency (nothing to compare). */
export function priceMatches(currency: string | undefined, amountMajor: number, plan: "annual" | "monthly"): boolean | null {
  if (!currency || currency.toUpperCase() === "USD") return null;
  const entry = Object.values(localPrices()).find((p) => p.currency === currency.toUpperCase());
  if (!entry) return null;
  const want = entry[plan];
  return Math.abs(amountMajor - want) / want <= 0.02; // taxes/rounding tolerance
}
