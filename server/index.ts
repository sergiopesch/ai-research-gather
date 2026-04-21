import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { z } from "zod";
import { generatePodcastScript } from "./openai";
import { searchPapers } from "./research";

const app = express();
const port = Number(process.env.PORT || 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");

app.use(express.json({ limit: "1mb" }));

const SearchRequestSchema = z.object({
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keywords: z.array(z.string()).default([]),
  limit: z.number().int().min(1).max(20).default(6),
});

const ScriptRequestSchema = z.object({
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/papers", async (req, res) => {
  try {
    const { since, keywords, limit } = SearchRequestSchema.parse(req.body);
    const papers = await searchPapers(keywords, since, limit);
    res.json({ papers });
  } catch (error) {
    console.error("paper search failed", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }

    res.status(500).json({ error: "Failed to search papers" });
  }
});

app.post("/api/generate-script", async (req, res) => {
  try {
    const { paper } = ScriptRequestSchema.parse(req.body);
    const script = await generatePodcastScript(paper);
    res.json(script);
  } catch (error) {
    console.error("script generation failed", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate script",
    });
  }
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
