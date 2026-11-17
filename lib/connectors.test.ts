import { describe, expect, it } from "vitest";
import { claudeCodeCommands, mcpJson, regionForMarketplace } from "./connectors";

describe("connector setup", () => {
  it("builds Claude Code commands for the region with the personal Rocco URL", () => {
    const c = claudeCodeCommands("eu", "rw_abc");
    expect(c).toContain("claude mcp add --transport http amazon-ads https://advertising-ai-eu.amazon.com/mcp");
    expect(c).toContain("claude mcp add --transport http amazon-seller https://sellingpartner-ai.amazon.com/mcp");
    expect(c).toContain("claude mcp add --transport http rocco https://rocco.works/mcp/rw_abc");
  });
  it("builds .mcp.json and Cursor configs", () => {
    expect(JSON.parse(mcpJson("na")).mcpServers.rocco).toEqual({ type: "http", url: "https://rocco.works/mcp" });
    expect(JSON.parse(mcpJson("fe", null, "cursor")).mcpServers["amazon-ads"]).toEqual({ url: "https://advertising-ai-fe.amazon.com/mcp" });
  });
  it("maps marketplaces to regions", () => {
    expect(regionForMarketplace("UK")).toBe("eu");
    expect(regionForMarketplace("Japan")).toBe("fe");
    expect(regionForMarketplace("United States")).toBe("na");
  });
});
