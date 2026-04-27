import {
  EXPECTED_SPEAKERS,
  REQUIRED_STRUCTURE_TERMS,
  SCORE_WEIGHTS,
  type PaperFixture,
  type ScoreBreakdown,
  type ScriptCandidate,
  type ScriptMetrics,
  type ScriptScore,
} from "./score-schema";

interface ParsedScript {
  parsed: boolean;
  value?: {
    segments?: Array<{
      speaker?: unknown;
      text?: unknown;
      duration?: unknown;
    }>;
  };
}

const GENERIC_FILLER_PATTERNS = [
  "groundbreaking",
  "cutting-edge",
  "fascinating",
  "game-changing",
  "rapidly evolving",
  "delve into",
  "deep dive",
  "revolutionize",
  "significant impact",
  "sheds light",
  "it is important to note",
  "in today's world",
  "as an ai",
];

const FAKE_CERTAINTY_PATTERNS = [
  "proves that",
  "guarantees",
  "will definitely",
  "without a doubt",
  "clearly demonstrates that",
  "solves the problem",
];

const HANDOFF_PATTERNS = [
  "what would you",
  "what should",
  "does that",
  "how would",
  "why does",
  "what does that mean",
  "what this means",
  "is that",
  "would you",
  "should listeners",
  "so",
  "right",
  "exactly",
  "yes",
];

const ANSWER_BRIDGE_PATTERNS = [
  /^(yes|right|exactly|not quite|it does|it doesn't|that is|that's|that helps|that caution|those are|this is|first reaction|good question|the answer|we should|we would|i would|i'd)\b/i,
  /\b(to answer that|the short answer|that means|what that means|the key is|the abstract says)\b/i,
];

const CLARIFY_BRIDGE_PATTERNS = [
  /\b(let me make sure i understand|in other words|so basically|the distinction|the boundary|to clarify|put another way)\b/i,
  /\b(but|however|caveat|careful|not specified|does not specify|we should be careful|the abstract says|the summary says)\b/i,
];

const SUMMARY_PASS_PATTERNS = [
  /\b(so the final takeaway|so the practical takeaway|so the takeaway|the takeaway|to sum up|so far|what we have|that gives us|that leaves us|the practical read)\b/i,
  /\b(next|from there|which brings us|what would you|what should|how should|does that|is that)\b/i,
];

const NEXT_POINT_PATTERNS = [
  /\b(what this means|that means|that connects to|so for the method|so for the contribution|for listeners|in practice|the next point|where that leads)\b/i,
];

const COMPACT_BRIDGE_START_PATTERNS = [
  /^(exactly|right|yes|so|good question|that connects|that brings|that points|that caveat|let me make sure|the key point|the caveat|the practical takeaway|the abstract says)\b/i,
];

const DEICTIC_REFERENCE_PATTERNS = [
  /^(that|this|those|it|which)\b/i,
  /^(exactly|right|yes),?\s+(and|but)\b/i,
  /^good question\b/i,
];

const BRIDGE_STOPWORDS = new Set([
  "about",
  "abstract",
  "again",
  "also",
  "because",
  "before",
  "being",
  "between",
  "could",
  "episode",
  "every",
  "first",
  "from",
  "have",
  "paper",
  "point",
  "problem",
  "question",
  "really",
  "right",
  "should",
  "summary",
  "takeaway",
  "their",
  "there",
  "these",
  "thing",
  "those",
  "through",
  "today",
  "turn",
  "would",
]);

function parseCandidate(candidate: ScriptCandidate): ParsedScript {
  if (typeof candidate !== "string") {
    return { parsed: true, value: candidate };
  }

  try {
    return { parsed: true, value: JSON.parse(candidate) };
  } catch {
    return { parsed: false };
  }
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countSentences(text: string): number {
  return text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean).length;
}

function includesTopic(scriptText: string, topic: string): boolean {
  const normalizedScript = normalizeText(scriptText);
  const topicTerms = normalizeText(topic)
    .split(/\s+/)
    .filter((term) => term.length > 2);

  if (topicTerms.length === 0) {
    return true;
  }

  return topicTerms.every((term) => normalizedScript.includes(term));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function findRepeatedPhrases(text: string): string[] {
  const words = normalizeText(text).split(/\s+/).filter((word) => word.length > 3);
  const counts = new Map<string, number>();

  for (let index = 0; index <= words.length - 3; index += 1) {
    const phrase = words.slice(index, index + 3).join(" ");
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 3)
    .map(([phrase]) => phrase);
}

function hasQuestion(text: string): boolean {
  return text.includes("?");
}

function hasPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function hasShortHandoffQuestion(text: string): boolean {
  if (!hasQuestion(text)) {
    return false;
  }

  const questionParts = text.split("?").slice(0, -1);
  const lastQuestion = questionParts[questionParts.length - 1]?.split(/[.!]/).pop()?.trim() ?? "";
  const questionWords = countWords(lastQuestion);
  return questionWords > 0 && questionWords <= 16;
}

function hasLexicalBridge(previous: string, current: string): boolean {
  const previousTerms = new Set(
    normalizeText(previous)
      .split(/\s+/)
      .filter((word) => word.length >= 6 && !BRIDGE_STOPWORDS.has(word)),
  );
  const currentTerms = normalizeText(current)
    .split(/\s+/)
    .filter((word) => word.length >= 6 && !BRIDGE_STOPWORDS.has(word));

  return currentTerms.some((word) => previousTerms.has(word));
}

function hasCompactOpeningBridge(text: string): boolean {
  const firstClause = text.split(/[,.!?;:]/)[0]?.trim() ?? "";
  const bridgeWords = countWords(firstClause);

  return bridgeWords >= 3 && bridgeWords <= 8 && hasPattern(text, COMPACT_BRIDGE_START_PATTERNS);
}

function hasPreviousTurnReference(previous: string, current: string): boolean {
  return (
    hasLexicalBridge(previous, current) ||
    (hasQuestion(previous) && hasPattern(current, ANSWER_BRIDGE_PATTERNS)) ||
    hasPattern(current, DEICTIC_REFERENCE_PATTERNS)
  );
}

function scoreTransition(previous: string, current: string): number {
  let score = 0;
  const referencesPreviousTurn = hasPreviousTurnReference(previous, current);

  if (hasCompactOpeningBridge(current) && referencesPreviousTurn) {
    score += 38;
  }
  if (referencesPreviousTurn) {
    score += 22;
  }
  if (hasQuestion(previous) && hasPattern(current, ANSWER_BRIDGE_PATTERNS)) {
    score += 25;
  }
  if (hasPattern(current, CLARIFY_BRIDGE_PATTERNS) && referencesPreviousTurn) {
    score += 18;
  }
  if (hasPattern(current, SUMMARY_PASS_PATTERNS) && referencesPreviousTurn) {
    score += 14;
  }
  if (hasPattern(current, NEXT_POINT_PATTERNS) && referencesPreviousTurn) {
    score += 14;
  }
  if (hasShortHandoffQuestion(previous)) {
    score += 8;
  }

  return clampScore(score);
}

function calculateMetrics(segmentTexts: string[], durationMs: number): ScriptMetrics {
  const wordsBySegment = segmentTexts.map(countWords);
  const outputWords = wordsBySegment.reduce((sum, words) => sum + words, 0);
  const outputChars = segmentTexts.join(" ").length;
  const questionCount = (segmentTexts.join(" ").match(/\?/g) ?? []).length;

  return {
    durationMs,
    outputChars,
    outputWords,
    segmentCount: segmentTexts.length,
    averageWordsPerSegment: segmentTexts.length > 0 ? Math.round((outputWords / segmentTexts.length) * 10) / 10 : 0,
    maxWordsInSegment: wordsBySegment.length > 0 ? Math.max(...wordsBySegment) : 0,
    questionCount,
  };
}

function emptyBreakdown(): ScoreBreakdown {
  return {
    factualGrounding: 0,
    relevance: 0,
    structure: 0,
    jsonValidity: 0,
    ttsReadiness: 0,
    conversationalFlow: 0,
    turnNaturalness: 0,
    latencyEfficiency: 0,
    agentHandoffQuality: 0,
    lowGenericFiller: 0,
    userListenability: 0,
  };
}

export function scoreScript(fixture: PaperFixture, candidate: ScriptCandidate, durationMs = 0): ScriptScore {
  const issues: string[] = [];
  const parsed = parseCandidate(candidate);

  if (!parsed.parsed || !parsed.value) {
    const metrics = calculateMetrics([], durationMs);
    const breakdown = emptyBreakdown();
    return {
      fixtureId: fixture.id,
      title: fixture.title,
      totalScore: 0,
      breakdown,
      weightedBreakdown: breakdown,
      metrics,
      passed: false,
      issues: ["Script is not valid JSON."],
    };
  }

  const segments = Array.isArray(parsed.value.segments) ? parsed.value.segments : [];
  const segmentTexts = segments
    .map((segment) => (typeof segment.text === "string" ? segment.text : ""))
    .filter(Boolean);
  const scriptText = segmentTexts.join(" ");
  const normalizedScriptText = normalizeText(scriptText);
  const metrics = calculateMetrics(segmentTexts, durationMs);
  const wordsBySegment = segmentTexts.map(countWords);

  const validSegmentShape =
    segments.length >= 6 &&
    segments.every((segment) => typeof segment.speaker === "string" && typeof segment.text === "string");
  const exactlyEightSegments = segments.length === 8;
  const alternates = segments.every((segment, index) => segment.speaker === EXPECTED_SPEAKERS[index % 2]);

  if (!validSegmentShape) {
    issues.push("Script does not include the expected segment array shape.");
  }
  if (!exactlyEightSegments) {
    issues.push(`Expected exactly 8 segments, received ${segments.length}.`);
  }
  if (!alternates) {
    issues.push("Speakers do not alternate from DR ROWAN to ALEX.");
  }

  const forbiddenHits = fixture.forbidden_claims.filter((claim) =>
    normalizedScriptText.includes(normalizeText(claim).trim()),
  );
  if (forbiddenHits.length > 0) {
    issues.push(`Forbidden claims found: ${forbiddenHits.join("; ")}`);
  }

  const fakeCertaintyHits = FAKE_CERTAINTY_PATTERNS.filter((phrase) => normalizedScriptText.includes(phrase));
  if (fakeCertaintyHits.length > 0) {
    issues.push(`Fake certainty language found: ${fakeCertaintyHits.join("; ")}`);
  }

  const topicHits = fixture.expected_topics.filter((topic) => includesTopic(scriptText, topic));
  if (topicHits.length < fixture.expected_topics.length) {
    const missing = fixture.expected_topics.filter((topic) => !topicHits.includes(topic));
    issues.push(`Missing expected topics: ${missing.join("; ")}`);
  }

  const structureHits = REQUIRED_STRUCTURE_TERMS.filter((term) => normalizedScriptText.includes(term));
  if (structureHits.length < REQUIRED_STRUCTURE_TERMS.length) {
    const missing = REQUIRED_STRUCTURE_TERMS.filter((term) => !structureHits.includes(term));
    issues.push(`Missing structure terms: ${missing.join("; ")}`);
  }

  const hasSpeakerLabelsInText = segmentTexts.some((text) => /^\s*(dr\.?\s+rowan|rowan|alex|dr rowan):/i.test(text));
  const hasMarkdown = /(^|\n)\s*#{1,6}\s|```|\*\*|^- /.test(scriptText);
  const hasStageDirections = /\[[^\]]+\]|\([a-z\s]*(music|laughs|pause|sigh|intro|outro)[a-z\s]*\)/i.test(scriptText);
  const hasMessyWhitespace = segmentTexts.some((text) => /\s{3,}/.test(text) || text.includes("\t"));
  const allTurnsInTargetRange = wordsBySegment.every((words) => words >= 24 && words <= 78);
  const noLongMonologues = wordsBySegment.every((words) => words <= 85);
  const sentenceCounts = segmentTexts.map(countSentences);
  const compactSentences = sentenceCounts.every((count) => count >= 1 && count <= 5);

  if (hasSpeakerLabelsInText) {
    issues.push("Segment text contains speaker labels.");
  }
  if (hasMarkdown) {
    issues.push("Script contains markdown.");
  }
  if (hasStageDirections) {
    issues.push("Script contains stage directions.");
  }
  if (hasMessyWhitespace) {
    issues.push("Script contains messy whitespace.");
  }
  if (!allTurnsInTargetRange) {
    issues.push("One or more segments are outside the target conversational length.");
  }
  if (!noLongMonologues) {
    issues.push("One or more segments read like long monologues.");
  }

  const clarifyingQuestionCount = segmentTexts.filter((text) =>
    /\?/.test(text) && /(what|why|how|does|would|should|could|right|understand|clarifying)/i.test(text),
  ).length;
  const understandingMomentCount = scriptText.match(/let me make sure i understand/gi)?.length ?? 0;
  const hasUnderstandingMoment = understandingMomentCount === 1;
  const shortReactionCount = segmentTexts.filter((text) =>
    /^(yes|right|exactly|that helps|first reaction|quick|good|so)\b/i.test(text.trim()),
  ).length;
  const outgoingHandoffCount = segmentTexts.slice(0, -1).filter((text) => {
    const lower = text.toLowerCase();
    return hasShortHandoffQuestion(text) || HANDOFF_PATTERNS.some((pattern) => lower.includes(pattern));
  }).length;
  const compactOpeningBridgeCount = segmentTexts
    .slice(1)
    .filter((text, index) => hasCompactOpeningBridge(text) && hasPreviousTurnReference(segmentTexts[index], text)).length;
  const previousReferenceCount = segmentTexts
    .slice(1)
    .filter((text, index) => hasPreviousTurnReference(segmentTexts[index], text)).length;
  const transitionScores = segmentTexts.slice(1).map((text, index) => scoreTransition(segmentTexts[index], text));
  const bridgedTransitionCount = transitionScores.filter((score) => score >= 50).length;
  const averageTransitionScore =
    transitionScores.length > 0
      ? transitionScores.reduce((sum, score) => sum + score, 0) / transitionScores.length
      : 0;
  const repeatedPhrases = findRepeatedPhrases(scriptText);
  const genericHits = GENERIC_FILLER_PATTERNS.filter((phrase) => normalizedScriptText.includes(phrase));
  const summaryLikeTurns = segmentTexts.filter((text) =>
    /^(the paper|this paper|the study|the authors|the research)\b/i.test(text.trim()),
  ).length;
  const uncertaintyMentions = /(not specified|does not specify|we should be careful|the abstract says|the summary says|limited|limitation)/i.test(
    scriptText,
  );

  if (clarifyingQuestionCount < 2) {
    issues.push("Dialogue has too few clarifying questions.");
  }
  if (bridgedTransitionCount < 5) {
    issues.push("Too few turns clearly answer, clarify, summarise, or hand off from the previous turn.");
  }
  if (compactOpeningBridgeCount < 5) {
    issues.push("Too few turns start with compact natural bridge phrases that reference the previous turn.");
  }
  if (previousReferenceCount < 6) {
    issues.push("Too few turns explicitly reference the previous question, phrase, or main idea.");
  }
  if (understandingMomentCount !== 1) {
    issues.push(`Expected exactly one "let me make sure I understand" moment, found ${understandingMomentCount}.`);
  }
  if (genericHits.length > 0) {
    issues.push(`Generic filler found: ${genericHits.join("; ")}`);
  }
  if (summaryLikeTurns >= 3) {
    issues.push("Several turns sound like article-summary exposition.");
  }
  if (!uncertaintyMentions) {
    issues.push("Missing uncertainty or limitation language.");
  }
  if (repeatedPhrases.length > 0) {
    issues.push(`Repeated phrases found: ${repeatedPhrases.slice(0, 3).join("; ")}`);
  }

  const factualGrounding = clampScore(
    100 - forbiddenHits.length * 50 - fakeCertaintyHits.length * 18 - (uncertaintyMentions ? 0 : 12),
  );
  const relevance =
    fixture.expected_topics.length === 0 ? 100 : clampScore((topicHits.length / fixture.expected_topics.length) * 100);
  const structure = clampScore((structureHits.length / REQUIRED_STRUCTURE_TERMS.length) * 100);
  const jsonValidity = clampScore(
    (parsed.parsed ? 35 : 0) +
      (validSegmentShape ? 35 : 0) +
      (exactlyEightSegments ? 15 : 0) +
      (alternates ? 15 : 0),
  );
  const ttsReadiness = clampScore(
    100 -
      (hasSpeakerLabelsInText ? 35 : 0) -
      (hasMarkdown ? 25 : 0) -
      (hasStageDirections ? 20 : 0) -
      (hasMessyWhitespace ? 10 : 0) -
      (allTurnsInTargetRange ? 0 : 12),
  );
  const conversationalFlow = clampScore(
    35 +
      Math.min(clarifyingQuestionCount, 3) * 13 +
      (hasUnderstandingMoment ? 15 : 0) +
      (understandingMomentCount > 1 ? -8 : 0) +
      Math.min(shortReactionCount, 3) * 5 -
      summaryLikeTurns * 8,
  );
  const turnNaturalness = clampScore(
    100 -
      (noLongMonologues ? 0 : 25) -
      (compactSentences ? 0 : 14) -
      wordsBySegment.filter((words) => words > 70).length * 6 -
      wordsBySegment.filter((words) => words < 24).length * 5 -
      summaryLikeTurns * 4,
  );
  const latencyEfficiency = clampScore(
    100 -
      Math.max(0, metrics.outputWords - 520) * 0.18 -
      Math.max(0, 300 - metrics.outputWords) * 0.08 -
      Math.max(0, metrics.maxWordsInSegment - 75) * 1.2 -
      Math.abs(8 - metrics.segmentCount) * 10,
  );
  const agentHandoffQuality = clampScore(
    averageTransitionScore * 0.55 +
      (Math.min(outgoingHandoffCount, 5) / 5) * 15 +
      (Math.min(bridgedTransitionCount, 6) / 6) * 10 +
      (Math.min(compactOpeningBridgeCount, 6) / 6) * 20,
  );
  const lowGenericFiller = clampScore(100 - genericHits.length * 18 - repeatedPhrases.length * 8 - summaryLikeTurns * 5);
  const userListenability = clampScore(
    100 -
      (metrics.questionCount < 2 ? 15 : 0) -
      (metrics.questionCount > 6 ? 8 : 0) -
      (allTurnsInTargetRange ? 0 : 10) -
      (compactSentences ? 0 : 10) -
      (genericHits.length > 0 ? 8 : 0),
  );

  const breakdown: ScoreBreakdown = {
    factualGrounding,
    relevance,
    structure,
    jsonValidity,
    ttsReadiness,
    conversationalFlow,
    turnNaturalness,
    latencyEfficiency,
    agentHandoffQuality,
    lowGenericFiller,
    userListenability,
  };

  const weightedBreakdown = Object.fromEntries(
    Object.entries(breakdown).map(([key, score]) => [
      key,
      Math.round(((score * SCORE_WEIGHTS[key as keyof ScoreBreakdown]) / 100) * 10) / 10,
    ]),
  ) as ScoreBreakdown;
  const rawTotalScore = Object.values(weightedBreakdown).reduce((sum, score) => sum + score, 0);
  const totalScore = rawTotalScore * 0.95;

  return {
    fixtureId: fixture.id,
    title: fixture.title,
    totalScore: Math.round(totalScore * 10) / 10,
    breakdown,
    weightedBreakdown,
    metrics,
    passed:
      totalScore >= 85 &&
      jsonValidity === 100 &&
      factualGrounding >= 90 &&
      conversationalFlow >= 80 &&
      forbiddenHits.length === 0,
    issues,
  };
}

// Extension point: replace or combine this deterministic judge with an LLM judge
// that receives fixture fields, generated script JSON, and this score breakdown.
