import type { PodcastScript } from "../server/openai";

export interface PaperFixture {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published_date: string;
  source: string;
  expected_topics: string[];
  forbidden_claims: string[];
}

export interface ScoreBreakdown {
  factualGrounding: number;
  relevance: number;
  structure: number;
  jsonValidity: number;
  ttsReadiness: number;
  conversationalFlow: number;
  turnNaturalness: number;
  latencyEfficiency: number;
  agentHandoffQuality: number;
  lowGenericFiller: number;
  userListenability: number;
}

export interface ScriptScore {
  fixtureId: string;
  title: string;
  totalScore: number;
  breakdown: ScoreBreakdown;
  weightedBreakdown: ScoreBreakdown;
  metrics: ScriptMetrics;
  passed: boolean;
  issues: string[];
}

export interface ScriptMetrics {
  durationMs: number;
  outputChars: number;
  outputWords: number;
  segmentCount: number;
  averageWordsPerSegment: number;
  maxWordsInSegment: number;
  questionCount: number;
}

export interface EvalResult {
  mode: "mock" | "real";
  generatedAt: string;
  averageScore: number;
  averageDurationMs: number;
  averageOutputChars: number;
  jsonValidityRate: number;
  categoryAverages: ScoreBreakdown;
  scores: ScriptScore[];
}

export type ScriptCandidate = PodcastScript | string;

export const SCORE_WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  factualGrounding: 22,
  relevance: 14,
  structure: 9,
  jsonValidity: 10,
  ttsReadiness: 6,
  conversationalFlow: 10,
  turnNaturalness: 8,
  latencyEfficiency: 6,
  agentHandoffQuality: 6,
  lowGenericFiller: 5,
  userListenability: 4,
};

export const REQUIRED_STRUCTURE_TERMS = [
  "problem",
  "method",
  "contribution",
  "limitation",
  "takeaway",
] as const;

export const EXPECTED_SPEAKERS = ["DR ROWAN", "ALEX"] as const;
