import { describe, expect, it } from "vitest";
import { generateMockPodcastScriptFromPaper } from "../server/openai";
import { scoreScript } from "./judge-script";
import type { PaperFixture } from "./score-schema";

const fixture: PaperFixture = {
  id: "eval-structure",
  title: "Retrieval Planning for Grounded Answers",
  summary: "The problem is evidence spread across long documents. The method plans retrieval before answering. Evaluation measures the contribution through answer faithfulness. A limitation is missing evidence, and the takeaway is to keep claims grounded.",
  authors: ["Researcher One", "Researcher Two"],
  published_date: "2026-01-01",
  source: "arXiv",
  expected_topics: ["retrieval", "answer faithfulness"],
  forbidden_claims: ["perfect accuracy"],
};

describe("script evaluation contract", () => {
  it("accepts title-cased display names when stable speaker IDs alternate", () => {
    const script = generateMockPodcastScriptFromPaper(fixture);
    const result = scoreScript(fixture, script);

    expect(result.metrics.segmentCount).toBe(8);
    expect(result.breakdown.jsonValidity).toBe(100);
    expect(result.issues).not.toContain("Speaker IDs do not alternate from speaker_1 to speaker_2.");
  });
});
