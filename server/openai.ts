import { randomUUID } from "node:crypto";
import type { Paper, PodcastScript, ScriptSegment } from "./types.js";

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

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

function normalizeSegmentText(text: string): string {
  return text.replace(/^(DR ROWAN|ALEX|Dr Rowan Patel|Alex Hughes)\s*:\s*/i, "").trim();
}

async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
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
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse;
  return data.choices?.[0]?.message?.content || "";
}

export async function generatePodcastScript(paper: Paper): Promise<PodcastScript> {
  const context = [
    `Title: ${paper.title}`,
    `Abstract: ${paper.summary || "Not available"}`,
    paper.authors?.length ? `Authors: ${paper.authors.join(", ")}` : "",
    `Published: ${paper.published_date}`,
    `Source: ${paper.source}`,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Using the paper context below, create a 10-segment podcast dialogue.

Requirements:
- Alternate speakers between DR ROWAN and ALEX.
- Keep each segment under 110 words.
- Make the explanation accurate but friendly for a smart non-expert.
- Cover the problem, the method, why it matters, one limitation, and one practical takeaway.
- Return valid JSON only in this exact format:
{
  "title": "The Notebook Pod: ...",
  "segments": [
    { "speaker": "DR ROWAN", "text": "..." },
    { "speaker": "ALEX", "text": "..." }
  ]
}

Paper context:
${context}`;

  const content = await callOpenAI([
    {
      role: "system",
      content:
        "You write concise podcast scripts about AI research. You must return strict JSON with no markdown fences.",
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  const parsed = JSON.parse(content) as { title?: string; segments?: Array<{ speaker?: string; text?: string }> };
  const segments: ScriptSegment[] = (parsed.segments || []).map((segment) => ({
    speaker: segment.speaker?.toUpperCase().includes("ROWAN") ? "DR ROWAN" : "ALEX",
    text: normalizeSegmentText(segment.text || ""),
    duration: Math.max(10, Math.floor((segment.text || "").length / 12)),
  }));

  if (segments.length === 0) {
    throw new Error("OpenAI returned an empty script");
  }

  const totalSeconds = segments.reduce((sum, segment) => sum + (segment.duration || 0), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    id: paper.id || randomUUID(),
    title: parsed.title?.trim() || `The Notebook Pod: ${paper.title}`,
    segments,
    totalDuration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    createdAt: new Date().toISOString(),
  };
}
