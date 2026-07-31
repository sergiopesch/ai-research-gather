import { randomUUID } from "node:crypto";
import { anthropic } from "@ai-sdk/anthropic";
import { deepgram } from "@ai-sdk/deepgram";
import { elevenLabs } from "@ai-sdk/elevenlabs";
import { google } from "@ai-sdk/google";
import { lmnt } from "@ai-sdk/lmnt";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { generateSpeech, generateText, Output, streamText, type LanguageModel, type SpeechModel } from "ai";
import { z } from "zod";
import { DEFAULT_CONVERSATION_TURNS } from "../shared/conversation.js";
import { getModelCatalog, hasGatewayCredentials, isGatewayFreeScriptRoute, isSubscriptionScriptRoute, parseModelRoute, toGatewayModelId } from "./model-catalog.js";
import { generateWithSubscription } from "./subscription-adapters.js";
import type { ConversationSettings, Paper, PodcastScript, ScriptSegment, ScriptSpeakerConfig, ScriptSpeakerId, SpeechConfig } from "../shared/research.js";

export type { PodcastScript };

export interface ResearchPaperInput {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published_date: string;
  source: string;
}

const DEFAULT_SCRIPT_MODEL = "openai:gpt-5.5";
const DEFAULT_SPEAKERS: ScriptSpeakerConfig[] = [
  { id: "speaker_1", name: "Dr. Rowan", model: DEFAULT_SCRIPT_MODEL },
  { id: "speaker_2", name: "Alex", model: DEFAULT_SCRIPT_MODEL },
];
const SPEAKER_IDS = ["speaker_1", "speaker_2"] as const satisfies readonly ScriptSpeakerId[];
const TURN_OUTPUT_SCHEMA = z.object({ text: z.string().trim().min(20).max(800) });
const CONVERSATION_TURN_SCHEMA = z.object({
  speakerId: z.enum(SPEAKER_IDS),
  text: z.string().trim().min(20).max(800),
});
type TurnGoal = { key: string; instruction: string; requiredTerm: string };

const OPENING_GOALS: TurnGoal[] = [
  { key: "problem", instruction: "Set up the paper, name the problem, and ask a short clarifying question.", requiredTerm: "problem" },
  { key: "contribution", instruction: 'Answer the setup, include "Let me make sure I understand", and identify the contribution.', requiredTerm: "contribution" },
];

const EXPLORATION_GOALS: TurnGoal[] = [
  { key: "method", instruction: "Explain the method described by the source and connect it to the previous turn.", requiredTerm: "method" },
  { key: "assumption", instruction: "Surface one assumption the approach appears to make, without inventing missing details.", requiredTerm: "assumption" },
  { key: "mechanism", instruction: "Clarify how the described approach is supposed to address the problem.", requiredTerm: "mechanism" },
  { key: "comparison", instruction: "Ask what a fair comparison or baseline would need to establish.", requiredTerm: "comparison" },
  { key: "setup", instruction: "Identify what is known and unknown about the experimental setup.", requiredTerm: "setup" },
  { key: "evaluation", instruction: "Pressure-test the evaluation and keep every claim inside the source text.", requiredTerm: "evaluation" },
  { key: "metric", instruction: "Discuss what a meaningful metric would reveal and what the summary does not report.", requiredTerm: "metric" },
  { key: "result", instruction: "State the strongest grounded result or, if absent, clearly name that absence.", requiredTerm: "result" },
  { key: "implication", instruction: "Explore one careful implication without turning it into an unsupported claim.", requiredTerm: "implication" },
  { key: "generalization", instruction: "Ask whether the source supports generalization beyond its stated setting.", requiredTerm: "generalization" },
  { key: "limitation", instruction: "Name a limitation from the source or say that the summary does not specify it.", requiredTerm: "limitation" },
  { key: "failure", instruction: "Describe a plausible failure question a reader should investigate, framed explicitly as a question.", requiredTerm: "failure" },
  { key: "missing", instruction: "Call out one missing detail that matters for interpreting the work.", requiredTerm: "detail" },
  { key: "practice", instruction: "Consider what would need validation before practical use.", requiredTerm: "practice" },
  { key: "experiment", instruction: "Propose the next evidence-gathering experiment as a question, not a claimed fact.", requiredTerm: "experiment" },
  { key: "evidence", instruction: "Clarify what evidence a listener should check before trusting the contribution.", requiredTerm: "evidence" },
];

const CLOSING_GOALS: TurnGoal[] = [
  { key: "synthesis", instruction: "Synthesize how the problem, method, evidence, and limitation fit together.", requiredTerm: "contribution" },
  { key: "takeaway", instruction: "Close with one concise shared takeaway and do not introduce a new topic.", requiredTerm: "takeaway" },
];

function selectEvenly<T>(values: T[], count: number): T[] {
  if (count <= 0) return [];
  if (count === 1) return [values[0]];
  return Array.from({ length: count }, (_, index) => values[Math.round(index * (values.length - 1) / (count - 1))]);
}

function buildTurnPlan(turnCount: number): TurnGoal[] {
  return [...OPENING_GOALS, ...selectEvenly(EXPLORATION_GOALS, turnCount - 4), ...CLOSING_GOALS];
}

type SegmentListener = (segment: ScriptSegment, index: number) => void | Promise<void>;

function getDefaultScriptModel(): string {
  const firstProvider = getModelCatalog().scriptProviders.find((provider) => provider.configured);
  return firstProvider ? `${firstProvider.id}:${firstProvider.models[0].id}` : DEFAULT_SCRIPT_MODEL;
}

function resolveLanguageModel(route: string): LanguageModel | string {
  const { providerId, modelId } = parseModelRoute(route);
  if (isGatewayFreeScriptRoute(route)) {
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!apiKey) throw new Error("AI Gateway authentication is not configured.");
    const gatewayOpenAI = createOpenAI({
      name: "vercel-ai-gateway",
      apiKey,
      baseURL: "https://ai-gateway.vercel.sh/v1",
    });
    return gatewayOpenAI.chat(toGatewayModelId(route));
  }

  switch (providerId) {
    case "openai":
      return openai.responses(modelId);
    case "anthropic":
      return anthropic(modelId);
    case "google":
      return google(modelId);
    case "xai":
      return xai.responses(modelId);
    default:
      throw new Error(`Unsupported script provider: ${providerId}`);
  }
}

function resolveSpeechModel(config: SpeechConfig): SpeechModel {
  switch (config.providerId) {
    case "openai":
      return openai.speech(config.modelId);
    case "elevenlabs":
      return elevenLabs.speech(config.modelId);
    case "deepgram":
      return deepgram.speech(config.modelId);
    case "lmnt":
      return lmnt.speech(config.modelId);
    default:
      throw new Error(`Unsupported voice provider: ${config.providerId}`);
  }
}

function normalizeSpeakerName(name: string, fallback: string): string {
  const normalized = name.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized.slice(0, 40) : fallback;
}

function resolveSpeakerConfigs(speakers?: ScriptSpeakerConfig[]): ScriptSpeakerConfig[] {
  const fallbackModel = getDefaultScriptModel();
  return DEFAULT_SPEAKERS.map((defaultSpeaker, index) => {
    const provided = speakers?.[index];
    return {
      id: SPEAKER_IDS[index],
      name: normalizeSpeakerName(provided?.name ?? defaultSpeaker.name, defaultSpeaker.name),
      model: provided?.model || fallbackModel,
      voice: provided?.voice,
    };
  });
}

function estimateDurationSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.round(words / 2.6));
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function normalizeSegmentText(text: string, speakers: ScriptSpeakerConfig[]): string {
  const escapedNames = speakers.map((speaker) => speaker.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const labels = [...escapedNames, "DR\\s+ROWAN", "ALEX", "Rowan", "Alex"].join("|");
  return text.replace(new RegExp(`^\\s*(?:${labels}):\\s*`, "i"), "").replace(/\s+/g, " ").trim();
}

function isUsableHostedTurn(text: string): boolean {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return wordCount >= 12
    && wordCount <= 90
    && text.length <= 900
    && !/\b(?:the user wants|i need to|let me draft|word count|system prompt|draft:)\b/i.test(text)
    && !/<\/?think>/i.test(text);
}

function toResearchPaperInput(paper: Paper | ResearchPaperInput): ResearchPaperInput {
  return {
    id: paper.id || randomUUID(),
    title: paper.title,
    summary: paper.summary || "Summary unavailable. Only title, source, and publication date are available.",
    authors: paper.authors || [],
    published_date: paper.published_date,
    source: paper.source,
  };
}

function buildScript(
  paper: ResearchPaperInput,
  speakers: ScriptSpeakerConfig[],
  segments: ScriptSegment[],
  settings: ConversationSettings,
  generationMode: PodcastScript["generationMode"] = "ai",
  generationNotice?: string,
): PodcastScript {
  const totalSeconds = segments.reduce((sum, segment) => sum + (segment.duration || 0), 0);
  return {
    id: paper.id,
    title: `The Notebook Pod: ${paper.title}`,
    settings,
    speakers,
    segments,
    totalDuration: formatDuration(totalSeconds),
    createdAt: new Date().toISOString(),
    generationMode,
    generationNotice,
  };
}

function errorMessages(error: unknown): string[] {
  const messages: string[] = [];
  const queue: unknown[] = [error];
  const visited = new Set<unknown>();
  for (let index = 0; index < queue.length && index < 24; index += 1) {
    const current = queue[index];
    if (!current || visited.has(current)) continue;
    visited.add(current);
    if (typeof current === "string") {
      messages.push(current);
      continue;
    }
    if (current instanceof Error) messages.push(current.message);
    if (typeof current !== "object") continue;
    const record = current as Record<string, unknown>;
    for (const key of ["cause", "lastError", "error", "message", "responseBody", "data"]) {
      if (record[key] !== undefined) queue.push(record[key]);
    }
  }
  return messages;
}

function isGatewayCapacityError(error: unknown): boolean {
  const messages = errorMessages(error);
  return messages.some((message) => /rate.?limit|budget|payment required|quota|capacity/i.test(message));
}

function isGatewayEntitlementError(error: unknown): boolean {
  const messages = errorMessages(error);
  return messages.some((message) => /free tier|paid credits|does not have access|access to this model|upgrade to paid/i.test(message));
}

function isRecoverableGatewayError(error: unknown): boolean {
  return isGatewayCapacityError(error) || isGatewayEntitlementError(error);
}

const HOSTED_FALLBACK_NOTICE = "The hosted free model is temporarily unavailable, so this episode uses the paper-grounded fallback. Try another free model, or run the repository locally with your own provider key.";

export function publicGenerationError(error: unknown): string {
  if (isRecoverableGatewayError(error)) {
    return "That hosted model is not currently available. Choose another free model, or run the repository locally with your own provider key.";
  }
  const message = error instanceof Error ? error.message : "Failed to generate script";
  return /https?:\/\/|upgrade|credits/i.test(message)
    ? "Generation could not be completed. Try another free model, or run the repository locally with your own provider key."
    : message;
}

function buildTurnInstructions(
  speakers: ScriptSpeakerConfig[],
  currentSpeaker: ScriptSpeakerConfig,
  turnIndex: number,
  turnPlan: TurnGoal[],
): string {
  const otherSpeaker = speakers.find((speaker) => speaker.id !== currentSpeaker.id) ?? speakers[0];
  const style = currentSpeaker.id === "speaker_1"
    ? "precise, explanatory, and careful about what the abstract actually says"
    : "curious, direct, pressure-testing, and focused on listener understanding";

  return `You are ${currentSpeaker.name} in a two-person research podcast with ${otherSpeaker.name}.
Your style is ${style}.

Evidence boundary:
- Use only the supplied title, summary, authors, date, and source.
- Do not invent benchmarks, datasets, institutions, quotes, numeric results, deployments, affiliations, or claims.
- If the abstract is thin, say what is not specified.

Conversation rules:
- Write exactly one TTS-ready turn for ${currentSpeaker.name}, without a speaker label.
- Sound like a live answer, clarification, handoff, or concise challenge.
- Reference the previous turn directly when one exists.
- Avoid fake banter, stage directions, markdown, and generic hype.
- This is turn ${turnIndex + 1} of ${turnPlan.length}: ${turnPlan[turnIndex].instruction}
- Include the word ${turnPlan[turnIndex].requiredTerm} naturally.
- Keep it between 24 and 58 words.`;
}

function buildTurnPrompt(paper: ResearchPaperInput, speakers: ScriptSpeakerConfig[], history: ScriptSegment[]): string {
  return `Paper:\n${JSON.stringify(paper, null, 2)}\n\nSpeakers:\n${JSON.stringify(
    speakers.map(({ id, name }) => ({ id, name })),
    null,
    2,
  )}\n\nConversation so far:\n${history.length ? history.map((segment) => `${segment.speaker}: ${segment.text}`).join("\n") : "No turns yet."}`;
}

function buildConversationInstructions(speakers: ScriptSpeakerConfig[], turnPlan: TurnGoal[]): string {
  return `Write one complete, natural research-podcast conversation between ${speakers[0].name} and ${speakers[1].name}.

Evidence boundary:
- Use only the supplied title, summary, authors, date, and source.
- Do not invent benchmarks, datasets, institutions, quotes, numeric results, deployments, affiliations, or claims.
- If the abstract is thin, say what is not specified.

Output rules:
- Return exactly ${turnPlan.length} turns in chronological order.
- Alternate speakerId exactly, beginning with speaker_1 and ending with speaker_2.
- Each turn is 24 to 58 words of TTS-ready dialogue with no speaker label, markdown, or stage directions.
- Make every turn answer, clarify, or challenge the previous turn so the exchange feels live rather than like separate summaries.
- Follow these turn goals in order: ${turnPlan.map((goal, index) => `${index + 1}) ${goal.instruction} Include “${goal.requiredTerm}” naturally.`).join(" ")}`;
}

async function generateSingleModelConversation(
  paper: ResearchPaperInput,
  speakers: ScriptSpeakerConfig[],
  settings: ConversationSettings,
  onSegment?: SegmentListener,
): Promise<PodcastScript> {
  const turnPlan = buildTurnPlan(settings.turnCount);
  const result = streamText({
    model: resolveLanguageModel(speakers[0].model),
    system: buildConversationInstructions(speakers, turnPlan),
    prompt: buildTurnPrompt(paper, speakers, []),
    output: Output.array({
      element: CONVERSATION_TURN_SCHEMA,
      name: "research_conversation",
      description: `Exactly ${settings.turnCount} alternating, paper-grounded podcast turns.`,
    }),
    maxOutputTokens: Math.min(6_000, settings.turnCount * 240),
    maxRetries: 2,
  });
  const generatedSegments: ScriptSegment[] = [];

  for await (const turn of result.elementStream) {
    if (generatedSegments.length >= settings.turnCount) continue;
    const index = generatedSegments.length;
    const currentSpeaker = speakers[index % speakers.length];
    const text = normalizeSegmentText(turn.text, speakers);
    const segment: ScriptSegment = {
      speaker: currentSpeaker.name,
      speakerId: currentSpeaker.id,
      speakerModel: currentSpeaker.model,
      text,
      duration: estimateDurationSeconds(text),
    };
    generatedSegments.push(segment);
    await onSegment?.(segment, index);
  }

  await result.output;

  if (generatedSegments.length !== settings.turnCount) {
    throw new Error(`The selected model returned ${generatedSegments.length} of ${settings.turnCount} dialogue turns.`);
  }
  return buildScript(paper, speakers, generatedSegments, settings);
}

async function generateSubscriptionConversation(
  paper: ResearchPaperInput,
  speakers: ScriptSpeakerConfig[],
  settings: ConversationSettings,
  onSegment?: SegmentListener,
): Promise<PodcastScript> {
  const { providerId } = parseModelRoute(speakers[0].model);
  const turns = await generateWithSubscription(providerId, paper, speakers, settings.turnCount);
  const segments: ScriptSegment[] = [];
  for (const [index, turn] of turns.entries()) {
    const speaker = speakers[index % speakers.length];
    const text = normalizeSegmentText(turn.text, speakers);
    const segment: ScriptSegment = {
      speaker: speaker.name,
      speakerId: speaker.id,
      speakerModel: speaker.model,
      text,
      duration: estimateDurationSeconds(text),
    };
    segments.push(segment);
    await onSegment?.(segment, index);
  }
  return buildScript(paper, speakers, segments, settings, "ai");
}

export async function generatePodcastScriptFromPaper(
  paper: ResearchPaperInput,
  speakers?: ScriptSpeakerConfig[],
  onSegment?: SegmentListener,
  settings: ConversationSettings = { turnCount: DEFAULT_CONVERSATION_TURNS },
): Promise<PodcastScript> {
  const normalizedPaper = toResearchPaperInput(paper);
  const speakerConfigs = resolveSpeakerConfigs(speakers);
  const turnPlan = buildTurnPlan(settings.turnCount);
  const generatedSegments: ScriptSegment[] = [];
  const subscriptionRoutes = speakerConfigs.filter((speaker) => isSubscriptionScriptRoute(speaker.model));
  if (subscriptionRoutes.length > 0) {
    if (subscriptionRoutes.length !== speakerConfigs.length || !speakerConfigs.every((speaker) => speaker.model === speakerConfigs[0].model)) {
      throw new Error("Use the same local subscription model for both speakers. Mixed routes are available with API models.");
    }
    return generateSubscriptionConversation(normalizedPaper, speakerConfigs, settings, onSegment);
  }
  const demoSegments = speakerConfigs.some((speaker) => parseModelRoute(speaker.model).providerId === "demo")
    ? generateMockPodcastScriptFromPaper(normalizedPaper, speakerConfigs, settings).segments
    : [];

  if (
    demoSegments.length === 0
    && speakerConfigs.every((speaker) => speaker.model === speakerConfigs[0].model)
    && !isGatewayFreeScriptRoute(speakerConfigs[0].model)
  ) {
    try {
      return await generateSingleModelConversation(normalizedPaper, speakerConfigs, settings, onSegment);
    } catch (error) {
      if (!hasGatewayCredentials() || !isRecoverableGatewayError(error)) throw error;
      const notice = HOSTED_FALLBACK_NOTICE;
      const fallback = generateMockPodcastScriptFromPaper(normalizedPaper, speakerConfigs, settings);
      fallback.generationMode = "fallback";
      fallback.generationNotice = notice;
      for (const [index, segment] of fallback.segments.entries()) await onSegment?.(segment, index);
      return fallback;
    }
  }

  const groundedFallbackSegments = generateMockPodcastScriptFromPaper(normalizedPaper, speakerConfigs, settings).segments;
  let fallbackNotice: string | undefined;
  let useFallbackForRemainingTurns = false;
  for (let index = 0; index < settings.turnCount; index += 1) {
    const currentSpeaker = speakerConfigs[index % speakerConfigs.length];
    const { providerId } = parseModelRoute(currentSpeaker.model);
    let generatedText: string | undefined;
    if (providerId === "demo" || useFallbackForRemainingTurns) {
      generatedText = demoSegments[index]?.text;
      if (useFallbackForRemainingTurns) generatedText = groundedFallbackSegments[index]?.text;
    } else {
      try {
        const sharedOptions = {
          model: resolveLanguageModel(currentSpeaker.model),
          system: buildTurnInstructions(speakerConfigs, currentSpeaker, index, turnPlan),
          prompt: buildTurnPrompt(normalizedPaper, speakerConfigs, generatedSegments),
          maxOutputTokens: 300,
          maxRetries: 2,
        };
        if (isGatewayFreeScriptRoute(currentSpeaker.model)) {
          // The zero-cost open models do not consistently support JSON-schema
          // response formats. Plain text is already the desired turn format and
          // keeps progressive rendering compatible across free providers.
          generatedText = (await generateText(sharedOptions)).text;
          if (!isUsableHostedTurn(generatedText)) {
            generatedText = groundedFallbackSegments[index]?.text;
            fallbackNotice = HOSTED_FALLBACK_NOTICE;
            useFallbackForRemainingTurns = true;
          }
        } else {
          generatedText = (await generateText({
            ...sharedOptions,
            output: Output.object({ schema: TURN_OUTPUT_SCHEMA }),
          })).output.text;
        }
      } catch (error) {
        if (!isGatewayFreeScriptRoute(currentSpeaker.model)) throw error;
        generatedText = groundedFallbackSegments[index]?.text;
        fallbackNotice = HOSTED_FALLBACK_NOTICE;
        useFallbackForRemainingTurns = true;
      }
    }
    if (!generatedText) throw new Error("The selected model did not return a dialogue turn.");
    const text = normalizeSegmentText(generatedText, speakerConfigs);
    const segment: ScriptSegment = {
      speaker: currentSpeaker.name,
      speakerId: currentSpeaker.id,
      speakerModel: currentSpeaker.model,
      text,
      duration: estimateDurationSeconds(text),
    };
    generatedSegments.push(segment);
    await onSegment?.(segment, index);
  }

  return buildScript(
    normalizedPaper,
    speakerConfigs,
    generatedSegments,
    settings,
    fallbackNotice ? "fallback" : "ai",
    fallbackNotice,
  );
}

export async function generateSpeechAudio(text: string, config: SpeechConfig): Promise<{ data: Uint8Array; mediaType: string }> {
  const result = await generateSpeech({
    model: resolveSpeechModel(config),
    text,
    voice: config.voiceId || undefined,
    outputFormat: "mp3",
    speed: config.speed,
    instructions: config.instructions || undefined,
    maxRetries: 2,
  });
  return { data: result.audio.uint8Array, mediaType: result.audio.mediaType || "audio/mpeg" };
}

type FallbackContext = {
  paper: ResearchPaperInput;
  firstSpeaker: ScriptSpeakerConfig;
  secondSpeaker: ScriptSpeakerConfig;
  authorLine: string;
  firstSentence: string;
  secondSentence: string;
  thirdSentence: string;
};

function fallbackTurnText(goal: TurnGoal, context: FallbackContext): string {
  const { paper, firstSpeaker, secondSpeaker, authorLine, firstSentence, secondSentence, thirdSentence } = context;
  switch (goal.key) {
    case "problem":
      return `We are examining ${paper.title}, from ${paper.source}, by ${authorLine}. The central problem is this: ${firstSentence} ${secondSpeaker.name}, what should we clarify first?`;
    case "contribution":
      return "Let me make sure I understand the contribution: we should separate what the abstract explicitly claims from what the title makes us imagine. What is the most defensible reading of the research step?";
    case "method":
      return `The method has to stay anchored to the source. ${secondSentence} If the summary does not name a component or procedure, we should leave it unknown rather than filling the gap.`;
    case "assumption":
      return "That method raises an assumption question: what conditions must hold for the approach to work as described? The summary may imply a setting, but it does not give us permission to invent operating conditions.";
    case "mechanism":
      return `The mechanism is the link between the stated problem and the proposed approach. ${firstSentence} I would check whether the summary actually explains that link or merely reports an outcome.`;
    case "comparison":
      return "A fair comparison would need a clearly defined baseline, the same evaluation conditions, and a reason the comparison answers the paper’s question. Does the supplied summary specify those pieces, or are they still open?";
    case "setup":
      return `On setup, the safe statement is limited: ${secondSentence} We should distinguish the details the abstract gives from the implementation choices a full paper may explain elsewhere.`;
    case "evaluation":
      return "The evaluation question is whether the evidence actually measures the claimed contribution. Without named datasets, baselines, or numeric results in the source, we can discuss the evaluation logic but not manufacture its outcome.";
    case "metric":
      return "A useful metric should connect directly to the original problem, not just produce an impressive number. The summary does not necessarily tell us which metric was used, so that remains a verification point.";
    case "result":
      return `The strongest result we can safely discuss is the source’s own statement: ${firstSentence} Anything more specific—especially a number, benchmark, or deployment claim—would need evidence not present here.`;
    case "implication":
      return "One careful implication is that the approach may change how this problem is studied, but implication is not proof of broad impact. We should keep that distinction explicit for the listener.";
    case "generalization":
      return "Generalization is still a question: does the evidence cover settings beyond the one described? If the abstract does not say so, we should not assume the method transfers unchanged.";
    case "limitation":
      return `A limitation is visible in the information boundary itself: ${thirdSentence} That does not invalidate the contribution, but it narrows what we can confidently conclude from this summary.`;
    case "failure":
      return "A useful failure question is: under what conditions would the proposed approach stop helping or produce a misleading result? The answer needs the paper’s evidence; we should not pretend the summary supplies it.";
    case "missing":
      return `The missing detail I would flag is the exact experimental context. ${thirdSentence} That detail matters because it determines how narrowly or broadly a reader should interpret the claim.`;
    case "practice":
      return "Before practice, I would want the full setup, comparisons, failure modes, and evidence that the effect survives realistic conditions. The abstract can motivate that work, but it cannot substitute for it.";
    case "experiment":
      return "The next experiment should test the contribution against a clear alternative under matched conditions. Which result would genuinely challenge the paper’s explanation, rather than simply repeat its preferred evaluation?";
    case "evidence":
      return "The evidence check is straightforward: trace each claim to an explicit source statement, then identify what remains unreported. That keeps the conversation useful without turning uncertainty into fictional detail.";
    case "synthesis":
      return "Putting it together, the problem motivates the method, the evaluation should support the contribution, and the limitations define its boundary. The paper is most useful when those four pieces remain connected.";
    case "takeaway":
      return `The shared takeaway is measured: ${firstSpeaker.name} and ${secondSpeaker.name} see a focused research contribution worth examining, while keeping every conclusion inside the supplied evidence and leaving missing details open.`;
    default:
      return "The source supports a careful question here, but not an invented answer. We should preserve that evidence boundary and use the full paper to resolve what the summary leaves unspecified.";
  }
}

export function generateMockPodcastScriptFromPaper(
  paper: ResearchPaperInput,
  speakers?: ScriptSpeakerConfig[],
  settings: ConversationSettings = { turnCount: DEFAULT_CONVERSATION_TURNS },
): PodcastScript {
  const normalizedPaper = toResearchPaperInput(paper);
  const speakerConfigs = resolveSpeakerConfigs(speakers);
  const [firstSpeaker, secondSpeaker] = speakerConfigs;
  const authorLine = normalizedPaper.authors.length
    ? `${normalizedPaper.authors.slice(0, 3).join(", ")}${normalizedPaper.authors.length > 3 ? " and colleagues" : ""}`
    : "the paper's authors";
  const summarySentences = normalizedPaper.summary.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  const firstSentence = summarySentences[0] ?? normalizedPaper.summary;
  const secondSentence = summarySentences[1] ?? "The abstract gives a compact view, so the safest reading is to stay close to what it explicitly reports.";
  const thirdSentence = summarySentences[2] ?? "Some implementation details, measurements, and deployment constraints are not specified.";
  const context = { paper: normalizedPaper, firstSpeaker, secondSpeaker, authorLine, firstSentence, secondSentence, thirdSentence };
  const texts = buildTurnPlan(settings.turnCount).map((goal) => fallbackTurnText(goal, context));
  const segments = texts.map((text, index) => {
    const speaker = speakerConfigs[index % speakerConfigs.length];
    return { speaker: speaker.name, speakerId: speaker.id, speakerModel: speaker.model, text, duration: estimateDurationSeconds(text) };
  });
  return buildScript(normalizedPaper, speakerConfigs, segments, settings, "demo");
}

export async function generatePodcastScript(
  paper: Paper,
  speakers?: ScriptSpeakerConfig[],
  onSegment?: SegmentListener,
  settings: ConversationSettings = { turnCount: DEFAULT_CONVERSATION_TURNS },
): Promise<PodcastScript> {
  return generatePodcastScriptFromPaper(toResearchPaperInput(paper), speakers, onSegment, settings);
}
