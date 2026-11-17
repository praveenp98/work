import { describe, expect, it } from "vitest";
import { parseSearchTermReport } from "../parsers/searchTerm";
import { loadFixture } from "../test-utils";
import { diffTerms, listingGaps, termSnapshot } from "./terms";

const terms = termSnapshot(parseSearchTermReport(loadFixture("sp-search-term-report.csv")).rows);

describe("termSnapshot", () => {
  it("keeps spend leaders and converting terms", () => {
    expect(terms.find((t) => t.t === "bamboo cutting board")?.o).toBe(85); // 45 auto + 40 exact
    expect(terms.some((t) => t.t === "free cutting board")).toBe(true);
  });
});

describe("diffTerms", () => {
  it("finds new burners, new winners and burners that stopped", () => {
    const prev = terms.filter((t) => t.t !== "free cutting board" && t.t !== "charcuterie board large");
    const cur = terms.filter((t) => t.t !== "plastic cutting board dishwasher safe");
    const d = diffTerms(prev, cur);
    expect(d.newBurners.map((t) => t.t)).toEqual(["free cutting board"]);
    expect(d.newWinners.map((t) => t.t)).toEqual(["charcuterie board large"]);
    expect(d.stoppedBurning.map((t) => t.t)).toContain("plastic cutting board dishwasher safe");
  });
});

describe("listingGaps", () => {
  it("finds converting words missing from the listing", () => {
    const g = listingGaps(terms, { title: "Bamboo Cutting Board for Kitchen", bullets: "Large wood board with juice groove", backend: "" });
    const charc = g.find((x) => x.term === "charcuterie board large");
    expect(charc?.missing).toEqual(["charcuterie"]);
    expect(charc?.where).toBe("title");
    const handle = g.find((x) => x.term === "wood cutting board with handle");
    expect(handle?.missing).toEqual(["handle"]);
    expect(g.some((x) => x.term === "bamboo cutting board")).toBe(false);
  });
});
