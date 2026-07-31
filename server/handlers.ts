import "./env.js";
import { z } from "zod";
import { DEFAULT_CONVERSATION_TURNS, MAX_CONVERSATION_TURNS, MIN_CONVERSATION_TURNS } from "../shared/conversation.js";
import type { ConversationSettings, Paper, PodcastScript, ScriptSpeakerConfig, SpeechConfig } from "../shared/research.js";
import { generateMockPodcastScriptFromPaper, generatePodcastScript, generateSpeechAudio, publicGenerationError } from "./openai.js";
import { assertScriptModelRoute, assertSpeechRoute, getModelCatalog } from "./model-catalog.js";
import { searchPapers } from "./research.js";
import {
  clearedOwnerSessionCookie,
  createOwnerSessionToken,
  isLocalRequest,
  isOwnerAuthenticated,
  isTrustedMutationOrigin,
  ownerAuthConfigured,
  ownerSessionCookie,
  requestFingerprint,
  verifyOwnerAccessKey,
} from "./auth.js";
import { acquireLock, getCached, incrementUsage, releaseLock, setCached, stableHash } from "./usage-store.js";

const SearchRequestSchema = z.object({
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keywords: z.array(z.string()).default([]),
  limit: z.number().int().min(1).max(20).default(6),
});

const SpeechConfigSchema = z.object({
  providerId: z.string().min(1).max(40),
  modelId: z.string().min(1).max(120),
  voiceId: z.string().max(160).optional(),
  speed: z.number().min(0.7).max(1.3),
  instructions: z.string().trim().max(240).optional(),
});

const SpeakerSchema = z.object({
  id: z.enum(["speaker_1", "speaker_2"]).optional(),
  name: z.string().trim().min(1).max(40),
  model: z.string().min(3).max(120),
  voice: SpeechConfigSchema.optional(),
});

const ConversationSettingsSchema = z.object({
  turnCount: z.number().int().min(MIN_CONVERSATION_TURNS).max(MAX_CONVERSATION_TURNS)
    .refine((value) => value % 2 === 0, "Turn count must be even."),
}).default({ turnCount: DEFAULT_CONVERSATION_TURNS });

export const ScriptRequestSchema = z.object({
  settings: ConversationSettingsSchema,
  speakers: z.tuple([SpeakerSchema, SpeakerSchema]).optional(),
  paper: z.object({
    id: z.string().trim().min(1).max(240),
    title: z.string().trim().min(1).max(500),
    url: z.string().url(),
    pdf_url: z.string().url().max(2_000).optional(),
    doi: z.string().max(240).optional(),
    source: z.string().trim().min(1).max(120),
    published_date: z.string().trim().min(1).max(40),
    authors: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
    summary: z.string().trim().max(6_000).optional(),
    importance: z.string().trim().max(1_000).optional(),
  }),
});

const SpeechRequestSchema = z.object({
  text: z.string().trim().min(1).max(800),
}).merge(SpeechConfigSchema.extend({ speed: z.number().min(0.7).max(1.3).default(1) }));

type RequestLike = {
  body?: unknown;
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | null };
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => unknown;
  setHeader?: (name: string, value: string) => void;
  write?: (chunk: string | Uint8Array) => unknown;
  end?: (chunk?: string | Uint8Array) => unknown;
  flushHeaders?: () => void;
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

function accessContext(req: RequestLike): { ownerAuthenticated: boolean; localRequest: boolean } {
  return { ownerAuthenticated: isOwnerAuthenticated(req), localRequest: isLocalRequest(req) };
}

function rejectUntrustedOrigin(req: RequestLike, res: ResponseLike): boolean {
  if (isTrustedMutationOrigin(req)) return false;
  setJsonHeaders(res);
  res.status(403).json({ error: "This request did not come from the studio." });
  return true;
}

function secondsUntilUtcMidnight(now = new Date()): number {
  const tomorrow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(60, Math.ceil((tomorrow - now.getTime()) / 1000));
}

function streamScript(res: ResponseLike, script: PodcastScript, notice?: string): void {
  res.status(200);
  res.setHeader?.("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader?.("Cache-Control", "no-cache, no-transform");
  res.setHeader?.("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write?.(`${JSON.stringify({ type: "start", totalTurns: script.settings.turnCount, notice })}\n`);
  script.segments.forEach((segment, index) => res.write?.(`${JSON.stringify({ type: "segment", index, segment })}\n`));
  res.write?.(`${JSON.stringify({ type: "complete", script })}\n`);
  res.end?.();
}

export function healthHandler(_req: RequestLike, res: ResponseLike): void {
  setJsonHeaders(res);
  res.status(200).json({ ok: true });
}

export function modelsHandler(req: RequestLike, res: ResponseLike): void {
  setJsonHeaders(res);
  res.status(200).json(getModelCatalog(accessContext(req)));
}

export function sessionHandler(req: RequestLike, res: ResponseLike): void {
  setJsonHeaders(res);
  res.setHeader?.("Cache-Control", "private, no-store");
  res.status(200).json({
    authenticated: isOwnerAuthenticated(req),
    ownerAuthConfigured: ownerAuthConfigured(),
    local: isLocalRequest(req),
  });
}

export async function loginHandler(req: RequestLike, res: ResponseLike): Promise<void> {
  if (rejectUntrustedOrigin(req, res)) return;
  try {
    const fingerprint = requestFingerprint(req);
    const attempts = await incrementUsage(`auth:attempt:${fingerprint}`, 15 * 60);
    if (attempts > 5) {
      setJsonHeaders(res);
      res.status(429).json({ error: "Too many attempts. Please wait a few minutes." });
      return;
    }
    const body = z.object({ accessKey: z.string().min(12).max(256) }).parse(await readJsonBody(req));
    if (!verifyOwnerAccessKey(body.accessKey)) {
      setJsonHeaders(res);
      res.status(401).json({ error: "That private access key is not valid." });
      return;
    }
    res.setHeader?.("Set-Cookie", ownerSessionCookie(createOwnerSessionToken()));
    res.setHeader?.("Cache-Control", "private, no-store");
    setJsonHeaders(res);
    res.status(200).json({ authenticated: true });
  } catch (error) {
    setJsonHeaders(res);
    res.status(error instanceof z.ZodError ? 400 : 500).json({ error: "Private access could not be started." });
  }
}

export function logoutHandler(req: RequestLike, res: ResponseLike): void {
  if (rejectUntrustedOrigin(req, res)) return;
  res.setHeader?.("Set-Cookie", clearedOwnerSessionCookie());
  res.setHeader?.("Cache-Control", "private, no-store");
  setJsonHeaders(res);
  res.status(200).json({ authenticated: false });
}

export async function papersHandler(req: RequestLike, res: ResponseLike): Promise<void> {
  if (rejectUntrustedOrigin(req, res)) return;
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
  if (rejectUntrustedOrigin(req, res)) return;
  let streaming = false;
  let lockKey: string | null = null;
  try {
    const body = await readJsonBody(req);
    const { paper, settings, speakers } = ScriptRequestSchema.parse(body) as {
      paper: Paper;
      settings: ConversationSettings;
      speakers?: ScriptSpeakerConfig[];
    };
    const context = accessContext(req);
    for (const speaker of speakers || []) {
      assertScriptModelRoute(speaker.model, context);
      if (speaker.voice) {
        assertSpeechRoute(speaker.voice.providerId, speaker.voice.modelId, speaker.voice.voiceId, context);
      }
    }
    const requestedSpeakers = speakers as ScriptSpeakerConfig[] | undefined;
    const isPublic = !context.ownerAuthenticated && !context.localRequest;
    const catalog = getModelCatalog(context);
    if (settings.turnCount > catalog.access.maxConversationTurns) {
      setJsonHeaders(res);
      res.status(400).json({ error: `This studio supports up to ${catalog.access.maxConversationTurns} conversation turns.` });
      return;
    }
    const cacheKey = `script:v4:${stableHash({ paper, settings, speakers: requestedSpeakers?.map(({ id, name, model: route }) => ({ id, name, model: route })) })}`;
    if (isPublic) {
      const cached = await getCached<PodcastScript>(cacheKey);
      if (cached) {
        if (res.write && res.end) streamScript(res, cached, "Shared from the public paper cache.");
        else { setJsonHeaders(res); res.status(200).json(cached); }
        return;
      }

      const fallbackReason = !catalog.access.publicAiEnabled
        ? "Public AI generation is paused. This paper-grounded version remains available."
        : undefined;
      const dailyKey = `usage:script:${new Date().toISOString().slice(0, 10)}:${requestFingerprint(req)}`;
      const count = fallbackReason ? catalog.access.publicDailyScriptLimit + 1 : await incrementUsage(dailyKey, secondsUntilUtcMidnight());
      if (count > catalog.access.publicDailyScriptLimit) {
        const fallback = generateMockPodcastScriptFromPaper({
          id: paper.id,
          title: paper.title,
          summary: paper.summary || "Summary unavailable. Only the paper metadata is available.",
          authors: paper.authors || [],
          published_date: paper.published_date,
          source: paper.source,
        }, requestedSpeakers, settings);
        fallback.generationMode = "fallback";
        fallback.generationNotice = fallbackReason || `Today’s public AI turn is used. This grounded version is still free; private and local studios remain unrestricted by this public limit.`;
        if (res.write && res.end) streamScript(res, fallback, fallback.generationNotice);
        else { setJsonHeaders(res); res.status(200).json(fallback); }
        return;
      }
      lockKey = `lock:script:${requestFingerprint(req)}`;
      if (!(await acquireLock(lockKey))) {
        lockKey = null;
        setJsonHeaders(res);
        res.status(429).json({ error: "One generation is already running in this browser." });
        return;
      }
    }

    streaming = Boolean(res.write && res.end);
    if (streaming) {
      res.status(200);
      res.setHeader?.("Content-Type", "application/x-ndjson; charset=utf-8");
      res.setHeader?.("Cache-Control", "no-cache, no-transform");
      res.setHeader?.("X-Accel-Buffering", "no");
      res.flushHeaders?.();
      res.write?.(`${JSON.stringify({ type: "start", totalTurns: settings.turnCount })}\n`);
    }

    const script = await generatePodcastScript(
      paper as Paper,
      speakers as ScriptSpeakerConfig[] | undefined,
      streaming
        ? (segment, index) => {
            res.write?.(`${JSON.stringify({ type: "segment", index, segment })}\n`);
          }
        : undefined,
      settings,
    );
    if (isPublic && script.generationMode === "ai") await setCached(cacheKey, script, 24 * 60 * 60);

    if (streaming) {
      res.write?.(`${JSON.stringify({ type: "complete", script })}\n`);
      res.end?.();
    } else {
      setJsonHeaders(res);
      res.status(200).json(script);
    }
  } catch (error) {
    console.error("script generation failed", error);

    if (streaming) {
      res.write?.(`${JSON.stringify({ type: "error", message: publicGenerationError(error) })}\n`);
      res.end?.();
      return;
    }

    setJsonHeaders(res);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors });
      return;
    }

    res.status(500).json({
      error: publicGenerationError(error),
    });
  } finally {
    if (lockKey) await releaseLock(lockKey);
  }
}

export async function generateSpeechHandler(req: RequestLike, res: ResponseLike): Promise<void> {
  if (rejectUntrustedOrigin(req, res)) return;
  try {
    const body = await readJsonBody(req);
    const config = SpeechRequestSchema.parse(body) as SpeechConfig & { text: string };
    assertSpeechRoute(config.providerId, config.modelId, config.voiceId, accessContext(req));
    const audio = await generateSpeechAudio(config.text, config);

    res.status(200);
    res.setHeader?.("Content-Type", audio.mediaType);
    res.setHeader?.("Cache-Control", "private, max-age=0, no-store");
    res.setHeader?.("Content-Length", String(audio.data.byteLength));
    res.end?.(audio.data);
  } catch (error) {
    console.error("speech generation failed", error);
    setJsonHeaders(res);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error.errors });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate speech" });
  }
}
