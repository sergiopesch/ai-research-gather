import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "../server/env";
import {
  generateMockPodcastScriptFromPaper,
  generatePodcastScriptFromPaper,
  type ResearchPaperInput,
} from "../server/openai";
import { scoreScript } from "./judge-script";
import { SCORE_WEIGHTS, type EvalResult, type PaperFixture, type ScoreBreakdown } from "./score-schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const fixturesPath = path.join(__dirname, "papers.json");
const reportsDir = path.join(__dirname, "reports");
const latestReportPath = path.join(reportsDir, "latest.json");

function parseMode(argv: string[]): "mock" | "real" {
  if (argv.includes("--real")) {
    return "real";
  }

  return "mock";
}

async function loadFixtures(): Promise<PaperFixture[]> {
  const raw = await readFile(fixturesPath, "utf8");
  const fixtures = JSON.parse(raw);

  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    throw new Error("evals/papers.json must contain a non-empty fixture array.");
  }

  return fixtures;
}

function toPaperInput(fixture: PaperFixture): ResearchPaperInput {
  return {
    id: fixture.id,
    title: fixture.title,
    summary: fixture.summary,
    authors: fixture.authors,
    published_date: fixture.published_date,
    source: fixture.source,
  };
}

function emptyCategoryAverages(): ScoreBreakdown {
  return Object.fromEntries(Object.keys(SCORE_WEIGHTS).map((key) => [key, 0])) as ScoreBreakdown;
}

function averageCategories(scores: Array<{ breakdown: ScoreBreakdown }>): ScoreBreakdown {
  const totals = emptyCategoryAverages();

  for (const score of scores) {
    for (const key of Object.keys(SCORE_WEIGHTS) as Array<keyof ScoreBreakdown>) {
      totals[key] += score.breakdown[key];
    }
  }

  for (const key of Object.keys(SCORE_WEIGHTS) as Array<keyof ScoreBreakdown>) {
    totals[key] = scores.length > 0 ? Math.round((totals[key] / scores.length) * 10) / 10 : 0;
  }

  return totals;
}

async function main() {
  const mode = parseMode(process.argv.slice(2));

  if (mode === "real" && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for --real evaluation. Use --mock to run without an API key.");
  }

  const fixtures = await loadFixtures();
  const scores = [];

  for (const fixture of fixtures) {
    const paper = toPaperInput(fixture);
    const startedAt = performance.now();
    const script =
      mode === "real"
        ? await generatePodcastScriptFromPaper(paper)
        : generateMockPodcastScriptFromPaper(paper);
    const durationMs = Math.round(performance.now() - startedAt);
    scores.push(scoreScript(fixture, script, durationMs));
  }

  const averageScore =
    Math.round((scores.reduce((sum, score) => sum + score.totalScore, 0) / scores.length) * 10) / 10;
  const averageDurationMs = Math.round(scores.reduce((sum, score) => sum + score.metrics.durationMs, 0) / scores.length);
  const averageOutputChars = Math.round(scores.reduce((sum, score) => sum + score.metrics.outputChars, 0) / scores.length);
  const validJsonCount = scores.filter((score) => score.breakdown.jsonValidity === 100).length;
  const jsonValidityRate = Math.round((validJsonCount / scores.length) * 1000) / 10;
  const result: EvalResult = {
    mode,
    generatedAt: new Date().toISOString(),
    averageScore,
    averageDurationMs,
    averageOutputChars,
    jsonValidityRate,
    categoryAverages: averageCategories(scores),
    scores,
  };

  await mkdir(reportsDir, { recursive: true });
  await writeFile(latestReportPath, `${JSON.stringify(result, null, 2)}\n`);

  const failed = scores.filter((score) => !score.passed);
  const relativeReport = path.relative(repoRoot, latestReportPath);
  console.log(`Script eval (${mode})`);
  console.log(`Average score: ${averageScore}/100`);
  console.log(`Average generation time: ${averageDurationMs}ms`);
  console.log(`Average output length: ${averageOutputChars} chars`);
  console.log(`JSON validity: ${jsonValidityRate}%`);
  console.log(
    `Conversation: flow ${result.categoryAverages.conversationalFlow}/100, handoff ${result.categoryAverages.agentHandoffQuality}/100, listenability ${result.categoryAverages.userListenability}/100`,
  );
  console.log(`Passed fixtures: ${scores.length - failed.length}/${scores.length}`);
  console.log(`Report: ${relativeReport}`);

  if (failed.length > 0) {
    console.log("Lowest scoring fixtures:");
    for (const score of [...scores].sort((a, b) => a.totalScore - b.totalScore).slice(0, 3)) {
      console.log(`- ${score.fixtureId}: ${score.totalScore}/100 (${score.issues[0] ?? "no issue details"})`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
