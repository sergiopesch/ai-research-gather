import { z } from "zod";
import type { Paper } from "./types.js";
import { generatePodcastScript } from "./openai.js";
import { searchPapers } from "./research.js";

export const SearchRequestSchema = z.object({
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keywords: z.array(z.string()).default([]),
  limit: z.number().int().min(1).max(20).default(6),
});

export const ScriptRequestSchema = z.object({
  paper: z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().url(),
    pdf_url: z.string().url().optional(),
    doi: z.string().optional(),
    source: z.string(),
    published_date: z.string(),
    authors: z.array(z.string()).optional(),
    summary: z.string().optional(),
    importance: z.string().optional(),
  }),
});

type RequestLike = {
  body?: unknown;
  method?: string;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => unknown;
  setHeader?: (name: string, value: string) => void;
};

async function readJsonBody(req: RequestLike): Promise<unknown> {
  if (typeof req.body === "string") {
    return req.body.length > 0 ? JSON.parse(req.body) : {};
  }

  if (req.body !== undefined) {
    return req.body;
  }

  if (!req.on || req.method === "GET" || req.method === "HEAD") {
    return {};
  }

  return new Promise((resolve, reject) => {
    let rawBody = "";

    req.on?.("data", (chunk) => {
      rawBody += String(chunk);
    });

    req.on?.("end", () => {
      try {
        resolve(rawBody.length > 0 ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on?.("error", reject);
  });
}

function setJsonHeaders(res: ResponseLike): void {
  res.setHeader?.("Content-Type", "application/json; charset=utf-8");
}

export function healthHandler(_req: RequestLike, res: ResponseLike): void {
  setJsonHeaders(res);
  res.status(200).json({ ok: true });
}

export async function papersHandler(req: RequestLike, res: ResponseLike): Promise<void> {
  try {
    const body = await readJsonBody(req);
    const { since, keywords, limit } = SearchRequestSchema.parse(body);
    const papers = await searchPapers(keywords, since, limit);

    setJsonHeaders(res);
    res.status(200).json({ papers });
  } catch (error) {
    console.error("paper search failed", error);

    setJsonHeaders(res);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors });
      return;
    }

    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to search papers" });
  }
}

export async function generateScriptHandler(req: RequestLike, res: ResponseLike): Promise<void> {
  try {
    const body = await readJsonBody(req);
    const { paper } = ScriptRequestSchema.parse(body);
    const script = await generatePodcastScript(paper as Paper);

    setJsonHeaders(res);
    res.status(200).json(script);
  } catch (error) {
    console.error("script generation failed", error);

    setJsonHeaders(res);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate script",
    });
  }
}
