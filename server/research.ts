import { randomUUID } from "node:crypto";
import type { Paper } from "./types";

type ResearchArea = {
  name: string;
  categories: string[];
  keywords: string[];
};

const ARXIV_RSS_URL = "https://rss.arxiv.org/rss";
const ARXIV_TIMEOUT_MS = 10000;
const ARXIV_USER_AGENT =
  process.env.ARXIV_USER_AGENT ||
  "ai-research-gather/1.0 (+https://github.com/sergiopesch/ai-research-gather)";

const RESEARCH_AREAS: ResearchArea[] = [
  {
    name: "Robotics",
    categories: ["cs.RO", "cs.SY"],
    keywords: [
      "Robotics",
      "robotics",
      "robot",
      "autonomous",
      "robotic",
      "manipulation",
      "navigation",
      "slam",
      "motion planning",
      "humanoid",
    ],
  },
  {
    name: "Computer Vision",
    categories: ["cs.CV"],
    keywords: [
      "Computer Vision",
      "computer vision",
      "image processing",
      "visual",
      "vision",
      "opencv",
      "segmentation",
      "detection",
      "recognition",
      "cnn",
      "yolo",
      "object detection",
    ],
  },
  {
    name: "Large Language Models",
    categories: ["cs.CL", "cs.AI", "cs.LG"],
    keywords: [
      "Large Language Models",
      "large language model",
      "llm",
      "gpt",
      "claude",
      "llama",
      "mistral",
      "gemini",
      "foundation model",
      "instruction tuning",
      "rag",
      "alignment",
    ],
  },
];

function decodeXmlText(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(text: string): string {
  return decodeXmlText(text).replace(/\s+/g, " ").trim();
}

function getPaperKey(paper: Paper): string {
  return (paper.doi || paper.url || paper.title).toLowerCase();
}

function dedupePapers(papers: Paper[]): Paper[] {
  const seen = new Set<string>();

  return papers.filter((paper) => {
    const key = getPaperKey(paper);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function detectSelectedAreas(keywords: string[]): ResearchArea[] {
  const normalized = new Set(keywords.map((keyword) => keyword.toLowerCase()));
  const matches = RESEARCH_AREAS.filter((area) =>
    area.keywords.some((keyword) => normalized.has(keyword.toLowerCase()))
  );

  return matches.length > 0 ? matches : RESEARCH_AREAS;
}

function selectDistributedPapers(papersByArea: Map<string, Paper[]>, selectedAreas: string[], limit: number): Paper[] {
  const perArea = Math.max(1, Math.floor(limit / selectedAreas.length));
  const selected: Paper[] = [];
  const selectedKeys = new Set<string>();

  for (const area of selectedAreas) {
    const papers = (papersByArea.get(area) || []).filter((paper) => !selectedKeys.has(getPaperKey(paper)));
    const taken = papers.slice(0, perArea);
    taken.forEach((paper) => selectedKeys.add(getPaperKey(paper)));
    selected.push(...taken);
  }

  let remaining = limit - selected.length;
  while (remaining > 0) {
    let added = false;

    for (const area of selectedAreas) {
      if (remaining <= 0) {
        break;
      }

      const nextPaper = (papersByArea.get(area) || []).find((paper) => !selectedKeys.has(getPaperKey(paper)));
      if (!nextPaper) {
        continue;
      }

      selectedKeys.add(getPaperKey(nextPaper));
      selected.push(nextPaper);
      remaining -= 1;
      added = true;
    }

    if (!added) {
      break;
    }
  }

  return selected.slice(0, limit);
}

function extractTagValue(block: string, tagName: string): string | null {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`<${escapedTagName}>([\\s\\S]*?)</${escapedTagName}>`, "i"));
  return match ? cleanText(match[1]) : null;
}

function extractAbstract(description: string): string {
  const abstractMatch = description.match(/Abstract:\s*([\s\S]*)$/i);
  return cleanText(abstractMatch ? abstractMatch[1] : description);
}

function matchesKeywords(paper: Paper, area: ResearchArea, selectedKeywords: string[]): boolean {
  const normalizedAreaKeywords = area.keywords.map((value) => value.toLowerCase());
  const normalizedSelectedKeywords = selectedKeywords
    .map((keyword) => keyword.toLowerCase())
    .filter((keyword) => !normalizedAreaKeywords.includes(keyword));

  if (normalizedSelectedKeywords.length === 0) {
    return true;
  }

  const haystack = `${paper.title} ${paper.summary || ""}`.toLowerCase();
  return normalizedSelectedKeywords.some((keyword) => haystack.includes(keyword));
}

async function fetchRssFeed(category: string): Promise<string> {
  const response = await fetch(`${ARXIV_RSS_URL}/${encodeURIComponent(category)}`, {
    signal: AbortSignal.timeout(ARXIV_TIMEOUT_MS),
    headers: {
      Accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
      "User-Agent": ARXIV_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`arXiv RSS error: ${response.status}`);
  }

  return response.text();
}

async function fetchArxivPapersForArea(
  area: ResearchArea,
  since: string,
  selectedKeywords: string[]
): Promise<Paper[]> {
  const sinceDate = new Date(since);
  const categoryFeeds = await Promise.all(area.categories.map((category) => fetchRssFeed(category)));
  const items = categoryFeeds.flatMap((feed) => feed.match(/<item>([\s\S]*?)<\/item>/g) || []);

  return items.flatMap((item) => {
    const title = extractTagValue(item, "title");
    const url = extractTagValue(item, "link");
    const description = extractTagValue(item, "description");
    const pubDate = extractTagValue(item, "pubDate");
    const authorText = extractTagValue(item, "dc:creator");

    if (!title || !url || !description || !pubDate) {
      return [];
    }

    const publishedAt = new Date(pubDate);
    if (Number.isNaN(publishedAt.getTime())) {
      return [];
    }

    const publishedDate = publishedAt.toISOString().split("T")[0];
    const paperDate = new Date(publishedDate);
    if (Number.isNaN(paperDate.getTime()) || paperDate < sinceDate) {
      return [];
    }

    const doi = url.split("/").pop()?.split("v")[0];
    const authors = authorText
      ? authorText.split(",").map((author) => cleanText(author)).filter(Boolean).slice(0, 4)
      : [];

    const paper: Paper = {
      id: doi || randomUUID(),
      title,
      url,
      pdf_url: doi ? `https://arxiv.org/pdf/${doi}.pdf` : url,
      doi,
      source: "arXiv",
      published_date: publishedDate,
      authors,
      summary: extractAbstract(description),
    };

    return matchesKeywords(paper, area, selectedKeywords) ? [paper] : [];
  });
}

export async function searchPapers(keywords: string[], since: string, limit: number): Promise<Paper[]> {
  const selectedAreas = detectSelectedAreas(keywords);
  const papersByArea = new Map<string, Paper[]>();

  for (const area of selectedAreas) {
    const papers = dedupePapers(await fetchArxivPapersForArea(area, since, keywords));
    papersByArea.set(
      area.name,
      papers.sort((a, b) => b.published_date.localeCompare(a.published_date))
    );
  }

  return dedupePapers(
    selectDistributedPapers(
      papersByArea,
      selectedAreas.map((area) => area.name),
      limit
    )
  );
}
