import { randomUUID } from "node:crypto";
import type { Paper, PodcastScript, ScriptModel, ScriptSegment, ScriptSpeakerConfig, ScriptSpeakerId } from "./types.js";

export type { PodcastScript };

export interface ResearchPaperInput {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published_date: string;
  source: string;
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type OpenAIJsonPayload = {
  text?: string;
  segments?: Array<{
    speaker?: string;
    text?: string;
  }>;
};

type SpeakerRole = {
  position: number;
  style: string;
};

export const SCRIPT_MODELS = ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5-mini", "gpt-5-nano"] as const satisfies readonly ScriptModel[];
export const DEFAULT_SCRIPT_MODEL: ScriptModel = "gpt-5.5";

const DEFAULT_SPEAKERS: ScriptSpeakerConfig[] = [
  { id: "speaker_1", name: "DR ROWAN", model: DEFAULT_SCRIPT_MODEL },
  { id: "speaker_2", name: "ALEX", model: "gpt-5.4-mini" },
];

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const FALLBACK_SCRIPT_MODEL = process.env.OPENAI_SCRIPT_MODEL || process.env.OPENAI_MODEL || DEFAULT_SCRIPT_MODEL;
const SCRIPT_MAX_TOKENS = Number.parseInt(process.env.OPENAI_SCRIPT_MAX_TOKENS ?? "1600", 10);
const SCRIPT_TURN_MAX_TOKENS = Number.parseInt(process.env.OPENAI_SCRIPT_TURN_MAX_TOKENS ?? "1200", 10);
const SPEAKER_IDS = ["speaker_1", "speaker_2"] as const satisfies readonly ScriptSpeakerId[];

const TURN_PLAN = [
  "Set up the paper, name the problem, and ask a short clarifying question.",
  'Answer the setup, include "Let me make sure I understand", and identify the contribution.',
  "Explain the method from the abstract and connect it to the previous turn.",
  "Pressure-test the method, ask what evidence or evaluation would matter, and keep it grounded.",
  "Name a limitation from the source text or say the summary does not specify it.",
  "Clarify the limitation, mention what a listener should check before trusting the claim.",
  "Summarize how the problem, method, and contribution fit together.",
  "Close with one concise shared takeaway and do not introduce a new topic.",
] as const;

const REQUIRED_TERMS_BY_TURN = [
  "problem",
  "contribution",
  "method",
  "evaluation",
  "limitation",
  "evidence",
  "contribution",
  "takeaway",
] as const;

export function isScriptModel(value: string): value is ScriptModel {
  return SCRIPT_MODELS.includes(value as ScriptModel);
}

function resolveScriptModel(model?: string): ScriptModel {
  if (model && isScriptModel(model)) {
    return model;
  }

  return isScriptModel(FALLBACK_SCRIPT_MODEL) ? FALLBACK_SCRIPT_MODEL : DEFAULT_SCRIPT_MODEL;
}

function normalizeSpeakerName(name: string, fallback: string): string {
  const normalized = name.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized.slice(0, 40) : fallback;
}

function resolveSpeakerConfigs(speakers?: ScriptSpeakerConfig[], legacyModel?: ScriptModel): ScriptSpeakerConfig[] {
  const fallbackModel = resolveScriptModel(legacyModel);

  return DEFAULT_SPEAKERS.map((defaultSpeaker, index) => {
    const provided = speakers?.[index];
    return {
      id: SPEAKER_IDS[index],
      name: normalizeSpeakerName(provided?.name ?? defaultSpeaker.name, defaultSpeaker.name),
      model: resolveScriptModel(provided?.model ?? legacyModel ?? defaultSpeaker.model ?? fallbackModel),
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSegmentText(text: string, speakers: ScriptSpeakerConfig[]): string {
  const speakerPattern = speakers.map((speaker) => escapeRegExp(speaker.name)).join("|");
  const labelPattern = speakerPattern.length > 0 ? `(?:${speakerPattern}|DR\\s+ROWAN|ALEX|Rowan|Alex)` : "(?:DR\\s+ROWAN|ALEX)";

  return text
    .replace(new RegExp(`^\\s*${labelPattern}:\\s*`, "i"), "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJsonObject(raw: string): OpenAIJsonPayload {
  try {
    return JSON.parse(raw) as OpenAIJsonPayload;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("OpenAI response was not valid JSON.");
    }

    return JSON.parse(raw.slice(start, end + 1)) as OpenAIJsonPayload;
  }
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
  segments: Array<{ speaker?: string; text?: string }>
): PodcastScript {
  const normalizedSegments: ScriptSegment[] = segments.map((segment, index) => {
    const speaker = speakers[index % speakers.length];
    const text = normalizeSegmentText(segment.text || "", speakers);
    return {
      speaker: speaker.name,
      speakerId: speaker.id,
      speakerModel: speaker.model,
      text,
      duration: estimateDurationSeconds(text),
    };
  });

  if (normalizedSegments.length === 0 || normalizedSegments.some((segment) => segment.text.length < 20)) {
    throw new Error("OpenAI returned an empty or invalid script");
  }

  const totalSeconds = normalizedSegments.reduce((sum, segment) => sum + (segment.duration || 0), 0);

  return {
    id: paper.id,
    title: `The Notebook Pod: ${paper.title}`,
    model: speakers[0].model,
    speakers,
    segments: normalizedSegments,
    totalDuration: formatDuration(totalSeconds),
    createdAt: new Date().toISOString(),
  };
}

function buildPaperJson(paper: ResearchPaperInput): string {
  return JSON.stringify(
    {
      title: paper.title,
      summary: paper.summary,
      authors: paper.authors,
      published_date: paper.published_date,
      source: paper.source,
    },
    null,
    2,
  );
}

function buildTurnInstructions(
  speakers: ScriptSpeakerConfig[],
  currentSpeaker: ScriptSpeakerConfig,
  turnIndex: number,
): string {
  const otherSpeaker = speakers.find((speaker) => speaker.id !== currentSpeaker.id) ?? speakers[0];
  const role: SpeakerRole =
    currentSpeaker.id === "speaker_1"
      ? { position: 1, style: "precise, explanatory, careful about what the abstract actually says" }
      : { position: 2, style: "curious, direct, pressure-testing, focused on listener understanding" };

  return `You are ${currentSpeaker.name}, speaker ${role.position} in a two-person research podcast.

The other speaker is ${otherSpeaker.name}.
Your style is ${role.style}.

Evidence boundary:
- Use only title, summary, authors, published_date, and source.
- Do not invent benchmarks, datasets, institutions, quotes, numeric results, deployments, author affiliations, or claims absent from those fields.
- If the abstract is thin, say what is not specified.
- Preserve paper-specific technical phrases when natural.

Conversation rules:
- Write exactly one turn for ${currentSpeaker.name}.
- Do not include speaker labels inside text.
- The turn must sound like a live answer, clarification, handoff, or concise challenge.
- Reference the previous turn directly when one exists.
- Avoid fake banter, stage directions, markdown, and generic hype.
- Use TTS-ready spoken language.

Turn task:
- This is turn ${turnIndex + 1} of 8.
- ${TURN_PLAN[turnIndex]}
- Include the word ${REQUIRED_TERMS_BY_TURN[turnIndex]} naturally.
- Keep it between 24 and 58 words.

Hard output rule:
- Return strict JSON only.
- Return exactly this JSON shape: { "text": "..." }`;
}

function buildTurnInput(
  paper: ResearchPaperInput,
  speakers: ScriptSpeakerConfig[],
  history: ScriptSegment[],
): ChatMessage[] {
  return [
    {
      role: "user",
      content: `Return JSON for the next dialogue turn.

Paper:
${buildPaperJson(paper)}

Speakers:
${JSON.stringify(
  speakers.map((speaker) => ({ id: speaker.id, name: speaker.name, model: speaker.model })),
  null,
  2,
)}

Conversation so far:
${history.length > 0 ? history.map((segment) => `${segment.speaker}: ${segment.text}`).join("\n") : "No turns yet."}`,
    },
  ];
}

function extractResponseText(data: OpenAIResponse): string | undefined {
  if (data.output_text) {
    return data.output_text;
  }

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.text) {
        return content.text;
      }
    }
  }

  return undefined;
}

async function callOpenAI(
  messages: ChatMessage[],
  model: ScriptModel,
  instructions: string,
  maxOutputTokens = SCRIPT_MAX_TOKENS,
  apiKey = process.env.OPENAI_API_KEY
): Promise<string> {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions,
      input: messages,
      reasoning: { effort: "low" },
      max_output_tokens: Number.isFinite(maxOutputTokens) ? maxOutputTokens : SCRIPT_MAX_TOKENS,
      text: { format: { type: "json_object" } },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  const content = extractResponseText(data);

  if (!content) {
    throw new Error("OpenAI response did not contain message content");
  }

  return content;
}

export async function generatePodcastScriptFromPaper(
  paper: ResearchPaperInput,
  speakers?: ScriptSpeakerConfig[] | ScriptModel,
  apiKey = process.env.OPENAI_API_KEY,
): Promise<PodcastScript> {
  const normalizedPaper = toResearchPaperInput(paper);
  const speakerConfigs = Array.isArray(speakers) ? resolveSpeakerConfigs(speakers) : resolveSpeakerConfigs(undefined, speakers);
  const generatedSegments: ScriptSegment[] = [];

  for (let index = 0; index < 8; index += 1) {
    const currentSpeaker = speakerConfigs[index % speakerConfigs.length];
    const raw = await callOpenAI(
      buildTurnInput(normalizedPaper, speakerConfigs, generatedSegments),
      currentSpeaker.model,
      buildTurnInstructions(speakerConfigs, currentSpeaker, index),
      SCRIPT_TURN_MAX_TOKENS,
      apiKey,
    );
    const payload = parseJsonObject(raw);
    const text = payload.text || payload.segments?.[0]?.text;

    if (!text) {
      throw new Error("OpenAI response did not include dialogue text.");
    }

    generatedSegments.push({
      speaker: currentSpeaker.name,
      speakerId: currentSpeaker.id,
      speakerModel: currentSpeaker.model,
      text,
      duration: estimateDurationSeconds(text),
    });
  }

  return buildScript(normalizedPaper, speakerConfigs, generatedSegments);
}

export function generateMockPodcastScriptFromPaper(
  paper: ResearchPaperInput,
  speakers: ScriptSpeakerConfig[] | ScriptModel = DEFAULT_SCRIPT_MODEL
): PodcastScript {
  const normalizedPaper = toResearchPaperInput(paper);
  const speakerConfigs = Array.isArray(speakers) ? resolveSpeakerConfigs(speakers) : resolveSpeakerConfigs(undefined, speakers);
  const [firstSpeaker, secondSpeaker] = speakerConfigs;
  const authorLine = normalizedPaper.authors.length > 0 ? normalizedPaper.authors.join(", ") : "the paper's authors";
  const summarySentences = normalizedPaper.summary
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const firstSentence = summarySentences[0] ?? normalizedPaper.summary;
  const secondSentence =
    summarySentences[1] ??
    "The abstract gives a compact view, so the safest reading is to stay close to what it explicitly reports.";
  const thirdSentence =
    summarySentences[2] ?? "Some implementation details, measurements, and deployment constraints are not specified.";

  return buildScript(normalizedPaper, speakerConfigs, [
    {
      text: `Quick setup: we are looking at ${normalizedPaper.title}, published on ${normalizedPaper.published_date} from ${normalizedPaper.source}. The authors listed are ${authorLine}. The problem starts here: ${firstSentence} ${secondSpeaker.name}, what would you pin down first?`,
    },
    {
      text: `First reaction to that problem: I want to know what is actually claimed, not what the title makes me imagine. Let me make sure I understand: we are staying inside the abstract and checking what it says was improved, right?`,
    },
    {
      text: `Exactly, that abstract boundary matters. The method is the anchor. ${secondSentence} Unless the summary names a dataset, benchmark number, institution, or deployment, we leave it out. Does that caution hold?`,
    },
    {
      text: `Right, that caution helps. The contribution is not a magic solution; it is a specific research step. What should a listener treat as the strongest grounded takeaway from the method?`,
    },
    {
      text: `That takeaway connects the problem, method, and evaluation angle. A limitation is also clear: ${thirdSentence} We can explain direction without pretending the abstract proves more than it does.`,
    },
    {
      text: `Good question, the limitation changes the read. Before trusting this in practice, we would want the exact setup, comparison points, failure modes, and whether the evidence matches the claim.`,
    },
    {
      text: `That evidence check is the bridge. The summary gives enough for a careful conversation, not a victory lap. The practical contribution is useful only if those checks hold up.`,
    },
    {
      text: `So the practical takeaway is measured: ${firstSpeaker.name} and I would call this a focused research contribution with useful specifics, while separating grounded claims from future work.`,
    },
  ]);
}

export async function generatePodcastScript(
  paper: Paper,
  speakers?: ScriptSpeakerConfig[],
  legacyModel?: ScriptModel,
): Promise<PodcastScript> {
  return generatePodcastScriptFromPaper(toResearchPaperInput(paper), speakers ?? legacyModel);
}
