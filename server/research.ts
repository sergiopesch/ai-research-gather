import { randomUUID } from "node:crypto";
import type { Paper } from "./types";

type ResearchArea = {
  name: string;
  keywords: string[];
  query: string;
};

const RESEARCH_AREAS: ResearchArea[] = [
  {
    name: "Robotics",
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
    query:
      '(cat:cs.RO OR cat:cs.SY) AND (all:"robotics" OR all:"robot" OR all:"autonomous" OR all:"manipulation" OR all:"navigation" OR all:"slam" OR all:"motion planning" OR all:"humanoid")',
  },
  {
    name: "Computer Vision",
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
    query:
      '(cat:cs.CV) AND (all:"computer vision" OR all:"image" OR all:"visual" OR all:"segmentation" OR all:"detection" OR all:"recognition" OR all:"object detection")',
  },
  {
    name: "Large Language Models",
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
    query:
      '(cat:cs.CL OR cat:cs.AI OR cat:cs.LG) AND (all:"large language model" OR all:"llm" OR all:"gpt" OR all:"foundation model" OR all:"instruction tuning" OR all:"prompt" OR all:"in-context learning" OR all:"chain of thought")',
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

async function fetchArxivPapersForArea(area: ResearchArea, since: string): Promise<Paper[]> {
  const params = new URLSearchParams({
    search_query: area.query,
    start: "0",
    max_results: "50",
    sortBy: "submittedDate",
    sortOrder: "descending",
  });

  const response = await fetch(`https://export.arxiv.org/api/query?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status}`);
  }

  const xmlText = await response.text();
  const entries = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
  const sinceDate = new Date(since);

  return entries.flatMap((entry) => {
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    const idMatch = entry.match(/<id>(.*?)<\/id>/);
    const authorMatches = [...entry.matchAll(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g)];

    if (!titleMatch || !summaryMatch || !publishedMatch || !idMatch) {
      return [];
    }

    const publishedDate = publishedMatch[1].split("T")[0];
    const paperDate = new Date(publishedDate);
    if (Number.isNaN(paperDate.getTime()) || paperDate < sinceDate) {
      return [];
    }

    const doi = idMatch[1].split("/").pop()?.split("v")[0];
    const authors = authorMatches.map((match) => cleanText(match[1])).slice(0, 4);

    return [
      {
        id: doi || randomUUID(),
        title: cleanText(titleMatch[1]),
        url: idMatch[1],
        pdf_url: doi ? `https://arxiv.org/pdf/${doi}.pdf` : idMatch[1],
        doi,
        source: "arXiv",
        published_date: publishedDate,
        authors,
        summary: cleanText(summaryMatch[1]),
      },
    ];
  });
}

export async function searchPapers(keywords: string[], since: string, limit: number): Promise<Paper[]> {
  const selectedAreas = detectSelectedAreas(keywords);
  const papersByArea = new Map<string, Paper[]>();

  await Promise.all(
    selectedAreas.map(async (area) => {
      const papers = dedupePapers(await fetchArxivPapersForArea(area, since));
      papersByArea.set(
        area.name,
        papers.sort((a, b) => b.published_date.localeCompare(a.published_date))
      );
    })
  );

  return dedupePapers(
    selectDistributedPapers(
      papersByArea,
      selectedAreas.map((area) => area.name),
      limit
    )
  );
}
