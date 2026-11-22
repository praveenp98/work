/**
 * Money in the account's own currency. Amazon reports come in the marketplace currency (India ₹, UK £, Germany €…),
 * so every amount from an account is shown with that marketplace's symbol. Rocco's own price stays in USD on the site
 * (Dodo's checkout shows the buyer's local price).
 *
 * The rules engine writes amounts as "$123"; `localize` swaps the symbol at display time for non-US accounts.
 * `toUsd` is only for comparing savings with Rocco's USD price (the "N× what I cost" line): approximate, stated as such.
 */
export interface Currency { code: string; symbol: string; usd: number }

const C = (code: string, symbol: string, usd: number): Currency => ({ code, symbol, usd });
const BY_COUNTRY: Record<string, Currency> = {
  US: C("USD", "$", 1), CA: C("CAD", "C$", 0.72), MX: C("MXN", "MX$", 0.055), BR: C("BRL", "R$", 0.18),
  GB: C("GBP", "£", 1.27), UK: C("GBP", "£", 1.27), IE: C("EUR", "€", 1.08), DE: C("EUR", "€", 1.08), FR: C("EUR", "€", 1.08),
  IT: C("EUR", "€", 1.08), ES: C("EUR", "€", 1.08), NL: C("EUR", "€", 1.08), BE: C("EUR", "€", 1.08),
  SE: C("SEK", "kr ", 0.095), PL: C("PLN", "zł ", 0.25), TR: C("TRY", "₺", 0.03),
  IN: C("INR", "₹", 0.012), JP: C("JPY", "¥", 0.0067), AU: C("AUD", "A$", 0.66), SG: C("SGD", "S$", 0.74),
  AE: C("AED", "AED ", 0.27), SA: C("SAR", "SAR ", 0.27), EG: C("EGP", "EGP ", 0.02), ZA: C("ZAR", "R ", 0.055),
};
export const USD = BY_COUNTRY.US;

export const currencyOf = (country?: string | null): Currency => BY_COUNTRY[(country ?? "US").toUpperCase()] ?? USD;

/** Whole-number money in this currency: "₹12,400". */
export const money = (n: number, c: Currency = USD) => `${n < 0 ? "-" : ""}${c.symbol}${Math.round(Math.abs(n)).toLocaleString("en-US")}`;

/** Swap "$" amounts in engine text for the account's symbol (leaves USD accounts untouched). */
export const localize = (text: string, c: Currency = USD) => (c.code === "USD" ? text : text.replace(/\$(?=\d)/g, c.symbol));

/** Approximate USD value (only for "N× what Rocco costs"). */
export const toUsd = (n: number, c: Currency = USD) => n * c.usd;
