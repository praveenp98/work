export const SITE = {
  name: "Rocco",
  domain: "rocco.works",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://rocco.works",
  tagline: "Your AI Amazon teammate. You approve, Rocco does the rest.",
  description:
    "Rocco is an AI Amazon teammate that works inside Claude and ChatGPT: he reads your Ads and Seller Central reports, proposes the exact changes, remembers what you applied and checks if it worked. Free to add.",
  x: "https://x.com/roccoworks",
  disclaimer: "Rocco is an independent tool and is not affiliated with, endorsed by or sponsored by Amazon.",
  contactEmail: "hello@rocco.works",
};

export const PLANS = [
  { id: "holiday", name: "Holiday Pass", price: 99, brands: 1, blurb: "Every tool, one brand, through Jan 31, 2027." },
  { id: "seller", name: "Seller Lifetime", price: 149, brands: 1, blurb: "One brand. Every tool, every update. Pay once." },
  { id: "pro", name: "Pro Lifetime", price: 299, brands: 5, blurb: "Up to 5 brands. For growing sellers and freelancers.", featured: true },
  { id: "agency", name: "Agency Lifetime", price: 399, brands: 20, blurb: "Up to 20 brands, white-label client reports." },
] as const;

/** Founding prices step up on these dates (real deadlines only). */
export const PRICE_STEPS = ["Nov 27, 2026", "Dec 1, 2026", "Dec 16, 2026"];
