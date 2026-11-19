import { describe, expect, it } from "vitest";
import { parseSearchTermReport } from "../parsers/searchTerm";
import { roast } from "../rules/roast";
import { loadFixture } from "../test-utils";
import { PLAYBOOK, PLAYBOOK_TOPICS } from "./playbook";
import { buildServer, roastSummary } from "./server";

const r = roast(parseSearchTermReport(loadFixture("sp-search-term-report.csv")));

describe("mcp", () => {
  it("free summary hides individual fixes and points to pricing", () => {
    const s = roastSummary(r, false);
    expect(s).toMatch(/grade C/); // stricter negatives (Nov 19)
    expect(s).toMatch(/pricing/);
    expect(s).not.toMatch(/### Negatives/);
  });
  it("full summary lists every fix and asks for approval", () => {
    const s = roastSummary(r, true);
    expect(s).toMatch(/### Negatives/);
    expect(s).toContain('"free cutting board"');
    expect(s).toMatch(/approval list/);
  });
  it("has a playbook with guardrails and builds a server", () => {
    expect(PLAYBOOK_TOPICS).toContain("guardrails");
    expect(PLAYBOOK.guardrails.body).toMatch(/approval/);
    expect(buildServer()).toBeTruthy();
  });
});
