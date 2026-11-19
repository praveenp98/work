/** One tap from an approval (dashboard or text) to Claude with the apply request typed; Amazon's connector then shows its preview + confirm. */
export const applyAsk = (codes: string[]) => `Rocco, apply my approved fixes: ${codes.join(", ")}`;
export const applyLink = (codes: string[]) => `https://claude.ai/new?q=${encodeURIComponent(applyAsk(codes))}`;
