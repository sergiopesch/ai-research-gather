import { randomUUID } from "node:crypto";
import type { Paper, PodcastScript, ScriptSegment } from "./types.js";

export interface ResearchPaperInput {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published_date: string;
  source: string;
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type OpenAIScriptPayload = {
  title?: string;
  segments?: Array<{
    speaker?: string;
    text?: string;
  }>;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const SCRIPT_MODEL = process.env.OPENAI_SCRIPT_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
const SCRIPT_TEMPERATURE = Number.parseFloat(process.env.OPENAI_SCRIPT_TEMPERATURE ?? "0.35");
const SCRIPT_MAX_TOKENS = Number.parseInt(process.env.OPENAI_SCRIPT_MAX_TOKENS ?? "1200", 10);
const SPEAKERS = ["DR ROWAN", "ALEX"] as const;

function estimateDurationSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.round(words / 2.6));
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function normalizeSegmentText(text: string): string {
  return text
    .replace(/^\s*(DR\s+ROWAN|Dr\.?\s+Rowan(?:\s+Patel)?|Rowan|ALEX|Alex(?:\s+Hughes)?):\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJsonObject(raw: string): OpenAIScriptPayload {
  try {
    return JSON.parse(raw) as OpenAIScriptPayload;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("OpenAI response was not valid JSON.");
    }

    return JSON.parse(raw.slice(start, end + 1)) as OpenAIScriptPayload;
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

function buildScript(paper: ResearchPaperInput, segments: Array<{ speaker?: string; text?: string }>): PodcastScript {
  const normalizedSegments: ScriptSegment[] = segments.map((segment, index) => {
    const text = normalizeSegmentText(segment.text || "");
    return {
      speaker: SPEAKERS[index % SPEAKERS.length],
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
    segments: normalizedSegments,
    totalDuration: formatDuration(totalSeconds),
    createdAt: new Date().toISOString(),
  };
}

function buildGroundedPrompt(paper: ResearchPaperInput): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You create compact, grounded podcast dialogue that sounds like two intelligent agents discussing a paper in real time.

Evidence boundary:
- Use only title, summary, authors, published_date, and source.
- Do not invent benchmarks, datasets, institutions, quotes, numeric results, deployments, author affiliations, or claims absent from those fields.
- Preserve paper-specific technical phrases from the title and summary when natural.
- Cover every named method, task, metric, benchmark/evaluation concept, limitation, and application area from the title or summary at least once.
- Do not sacrifice paper-specific coverage for conversational style.
- If the abstract is thin, say what is not specified. Do not fill gaps.

Conversation style:
- Make it feel live: short reactions, clarifying questions, and natural handoffs.
- DR ROWAN is precise and explanatory. ALEX pressure-tests, asks the listener's question, and checks understanding.
- Include at least two clarifying questions.
- Include exactly one ALEX turn with "Let me make sure I understand".
- Every turn after the first must explicitly reference one of: the previous segment's question, a phrase from the previous segment, or the previous segment's main idea.
- At least five turns after the first must start with a short natural bridge of 3 to 8 words, then add new information.
- Allowed bridge styles include "Exactly, and the key point is", "Right, but the caveat is", "That connects to the method", "So the practical takeaway is", "Let me make sure I understand", and "Good question, the abstract says".
- Use adjacent-turn bridge moves naturally: answer the previous question, challenge or clarify the previous point, summarise and pass, or connect "what this means" to the next point.
- After a bridge, name the referenced idea briefly instead of using a generic transition alone.
- Use short handoff questions when useful, but do not force every turn to end with a question.
- Vary bridge phrasing. Do not repeat the same bridge phrase or stock phrases such as "does that distinction hold" or "what would you check next".
- Keep handoffs short and purposeful. Do not add fake banter, compliments, or filler.
- Avoid essay paragraphs split between speakers.
- Avoid generic hype such as groundbreaking, cutting-edge, fascinating, game-changing, or rapidly evolving.
- Avoid fake certainty. Use "the abstract says", "the summary does not specify", or "we should be careful" where appropriate.

Hard rules:
- Strict JSON only.
- No markdown.
- No speaker labels inside text.
- No stage directions.
- TTS-ready spoken language only.

Return exactly this JSON shape:
{
  "segments": [
    { "speaker": "DR ROWAN", "text": "..." },
    { "speaker": "ALEX", "text": "..." }
  ]
}

Requirements:
- Exactly 8 segments.
- Speakers must alternate, starting with DR ROWAN.
- Each segment should be 24 to 58 words.
- Include the words problem, method, contribution, limitation, and takeaway naturally across the dialogue.
- If the source text mentions "classroom pilot", include that exact phrase.
- At least four transitions should clearly answer, clarify, summarise, or hand over from the previous turn.
- Keep the final turn as a concise shared takeaway, not a new topic.`,
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          title: paper.title,
          summary: paper.summary,
          authors: paper.authors,
          published_date: paper.published_date,
          source: paper.source,
        },
        null,
        2,
      ),
    },
  ];
}

async function callOpenAI(messages: ChatMessage[], apiKey = process.env.OPENAI_API_KEY): Promise<string> {
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
      model: SCRIPT_MODEL,
      messages,
      temperature: Number.isFinite(SCRIPT_TEMPERATURE) ? SCRIPT_TEMPERATURE : 0.35,
      max_tokens: Number.isFinite(SCRIPT_MAX_TOKENS) ? SCRIPT_MAX_TOKENS : 1200,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI response did not contain message content");
  }

  return content;
}

export async function generatePodcastScriptFromPaper(
  paper: ResearchPaperInput,
  apiKey = process.env.OPENAI_API_KEY,
): Promise<PodcastScript> {
  const normalizedPaper = toResearchPaperInput(paper);
  const raw = await callOpenAI(buildGroundedPrompt(normalizedPaper), apiKey);
  const payload = parseJsonObject(raw);

  if (!Array.isArray(payload.segments) || payload.segments.length < 6) {
    throw new Error("OpenAI response did not include the required segments array.");
  }

  return buildScript(normalizedPaper, payload.segments.slice(0, 8));
}

export function generateMockPodcastScriptFromPaper(paper: ResearchPaperInput): PodcastScript {
  const normalizedPaper = toResearchPaperInput(paper);
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

  return buildScript(normalizedPaper, [
    {
      text: `Quick setup: we are looking at ${normalizedPaper.title}, published on ${normalizedPaper.published_date} from ${normalizedPaper.source}. The authors listed are ${authorLine}. The problem starts here: ${firstSentence} Alex, what would you pin down first?`,
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
      text: `So the practical takeaway is measured: this is a focused research contribution with useful specifics, but the responsible read separates grounded claims from future work.`,
    },
  ]);
}

export async function generatePodcastScript(paper: Paper): Promise<PodcastScript> {
  return generatePodcastScriptFromPaper(toResearchPaperInput(paper));
}
