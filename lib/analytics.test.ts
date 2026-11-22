import { describe, expect, it } from "vitest";
import { scrub } from "./analytics";

describe("analytics never sends private team links", () => {
  it("scrubs team keys from URLs", () => {
    expect(scrub("https://rocco.works/w/rw_AbC123xyz456/log?brand=x")).toBe("https://rocco.works/w/[team]/log?brand=x");
    expect(scrub("https://rocco.works/mcp/rw_AbC123xyz456")).toBe("https://rocco.works/mcp/[team]");
    expect(scrub("https://rocco.works/admin?key=SECRET&email=a")).toBe("https://rocco.works/admin?key=[x]&email=a");
    expect(scrub("https://rocco.works/pricing")).toBe("https://rocco.works/pricing");
  });
});
