import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateScriptHandler, ScriptRequestSchema } from './handlers.js';
import { generateMockPodcastScriptFromPaper } from './openai.js';
import type { ScriptSpeakerConfig } from '../shared/research.js';

const paper = {
  id: 'paper-20',
  title: 'A grounded deep dive',
  url: 'https://example.com/paper-20',
  source: 'arXiv',
  published_date: '2026-07-31',
  authors: ['A. Researcher'],
  summary: 'The paper studies a difficult research problem. It proposes a careful method. Important experimental details are not specified in the abstract.',
};

const speakers: ScriptSpeakerConfig[] = [
  { id: 'speaker_1', name: 'Dr. Rowan', model: 'demo:notebook-demo' },
  { id: 'speaker_2', name: 'Alex', model: 'demo:notebook-demo' },
];

const originalVercel = process.env.VERCEL;
const originalGatewayKey = process.env.AI_GATEWAY_API_KEY;

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalGatewayKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
  else process.env.AI_GATEWAY_API_KEY = originalGatewayKey;
});

describe('conversation settings', () => {
  it('defaults legacy requests to eight turns', () => {
    const request = ScriptRequestSchema.parse({ paper, speakers });
    expect(request.settings.turnCount).toBe(8);
  });

  it('accepts even presets through twenty and rejects unbalanced counts', () => {
    expect(ScriptRequestSchema.parse({ paper, speakers, settings: { turnCount: 20 } }).settings.turnCount).toBe(20);
    expect(() => ScriptRequestSchema.parse({ paper, speakers, settings: { turnCount: 19 } })).toThrow(/even/i);
    expect(() => ScriptRequestSchema.parse({ paper, speakers, settings: { turnCount: 22 } })).toThrow();
  });

  it('builds a complete alternating twenty-turn grounded fallback', () => {
    const script = generateMockPodcastScriptFromPaper(paper, speakers, { turnCount: 20 });
    expect(script.settings.turnCount).toBe(20);
    expect(script.segments).toHaveLength(20);
    script.segments.forEach((segment, index) => {
      expect(segment.speakerId).toBe(index % 2 === 0 ? 'speaker_1' : 'speaker_2');
      expect(segment.text.length).toBeGreaterThan(20);
    });
  });

  it('enforces the eight-turn public ceiling before generation begins', async () => {
    process.env.VERCEL = '1';
    process.env.AI_GATEWAY_API_KEY = 'test-gateway-key';
    const publicSpeakers: ScriptSpeakerConfig[] = speakers.map((speaker) => ({
      ...speaker,
      model: 'inclusionai:ling-3.0-flash-free',
    }));
    const response = {
      status: vi.fn(),
      json: vi.fn(),
      setHeader: vi.fn(),
    };
    response.status.mockReturnValue(response);

    await generateScriptHandler({
      method: 'POST',
      headers: { host: 'ai-research-gather.vercel.app' },
      socket: { remoteAddress: '203.0.113.8' },
      body: { paper, speakers: publicSpeakers, settings: { turnCount: 20 } },
    }, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ error: 'This studio supports up to 8 conversation turns.' });
  });
});
