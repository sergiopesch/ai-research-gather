import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScriptGeneration } from './useScriptGeneration';
import type { Paper, PodcastScript, ScriptSpeakerConfig } from '@shared/research';

const paper: Paper = { id: 'paper-1', title: 'A useful paper', url: 'https://example.com/paper', source: 'arXiv', published_date: '2026-07-20' };
const speakers: ScriptSpeakerConfig[] = [
  { id: 'speaker_1', name: 'Dr. Rowan', model: 'openai:gpt-test' },
  { id: 'speaker_2', name: 'Alex', model: 'openai:gpt-test' },
];
const settings = { turnCount: 12 };
const firstSegment = { speaker: 'Dr. Rowan', speakerId: 'speaker_1' as const, speakerModel: 'openai:gpt-test', text: 'The problem is clearly framed in this grounded opening turn.', duration: 8 };
const secondSegment = { speaker: 'Alex', speakerId: 'speaker_2' as const, speakerModel: 'openai:gpt-test', text: 'Let me make sure I understand the contribution before we continue.', duration: 7 };

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useScriptGeneration', () => {
  it('reveals streamed turns before the request completes', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const complete: PodcastScript = { id: paper.id, title: `The Notebook Pod: ${paper.title}`, settings, speakers, segments: [firstSegment, secondSegment], totalDuration: '0:15', createdAt: new Date().toISOString() };
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'start', totalTurns: 12 })}\n${JSON.stringify({ type: 'segment', index: 0, segment: firstSegment })}\n`));
        await gate;
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'segment', index: 1, segment: secondSegment })}\n${JSON.stringify({ type: 'complete', script: complete })}\n`));
        controller.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(stream, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useScriptGeneration());
    let generation: Promise<void>;
    act(() => { generation = result.current.generateScript(paper, speakers, settings); });

    await waitFor(() => expect(result.current.script?.segments).toHaveLength(1));
    expect(result.current.isGeneratingScript).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ settings: { turnCount: 12 } });

    release?.();
    await act(async () => generation);
    expect(result.current.script?.segments).toHaveLength(2);
    expect(result.current.isGeneratingScript).toBe(false);
  });

  it('keeps revealing script turns while voice jobs are still queued', async () => {
    let releaseSpeech: (() => void) | undefined;
    const speechGate = new Promise<void>((resolve) => { releaseSpeech = resolve; });
    const voicedSpeakers: ScriptSpeakerConfig[] = speakers.map((speaker) => ({
      ...speaker,
      voice: { providerId: 'openai', modelId: 'tts-test', voiceId: 'coral', speed: 1 },
    }));
    const segments = [firstSegment, secondSegment, { ...firstSegment, text: 'A third turn arrives without waiting for audio.' }, { ...secondSegment, text: 'A fourth turn also renders immediately.' }];
    const complete: PodcastScript = { id: paper.id, title: `The Notebook Pod: ${paper.title}`, settings, speakers: voicedSpeakers, segments, totalDuration: '0:30', createdAt: new Date().toISOString() };
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const events = [
          { type: 'start', totalTurns: 4 },
          ...segments.map((segment, index) => ({ type: 'segment', index, segment })),
          { type: 'complete', script: complete },
        ];
        controller.enqueue(encoder.encode(`${events.map((event) => JSON.stringify(event)).join('\n')}\n`));
        controller.close();
      },
    });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test-audio') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('generate-script')) return new Response(stream, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } });
      await speechGate;
      return new Response(new Blob(['audio']), { status: 200, headers: { 'Content-Type': 'audio/mpeg' } });
    }));

    const { result } = renderHook(() => useScriptGeneration());
    let generation: Promise<void>;
    act(() => { generation = result.current.generateScript(paper, voicedSpeakers, settings); });

    await waitFor(() => expect(result.current.script?.segments).toHaveLength(4));
    expect(result.current.isGeneratingScript).toBe(false);
    expect(result.current.isGeneratingVoice).toBe(true);

    releaseSpeech?.();
    await act(async () => generation);
    expect(result.current.audioBySegment[3]?.status).toBe('ready');
  });

  it('stops an active generation cleanly', async () => {
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Stopped', 'AbortError')), { once: true });
    })));

    const { result } = renderHook(() => useScriptGeneration());
    let generation: Promise<void>;
    act(() => { generation = result.current.generateScript(paper, speakers, settings); });
    await waitFor(() => expect(result.current.isGeneratingScript).toBe(true));

    act(() => result.current.cancelGeneration());
    await act(async () => generation);

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.script?.segments).toHaveLength(0);
  });

  it('ignores stale results when a new generation starts after cancellation', async () => {
    let releaseFirst: ((response: Response) => void) | undefined;
    const firstResponse = new Promise<Response>((resolve) => { releaseFirst = resolve; });
    const newestSegment = { ...secondSegment, text: 'This turn belongs to the newest generation.' };
    const newestScript: PodcastScript = { id: paper.id, title: 'Newest', settings, speakers, segments: [newestSegment], totalDuration: '0:07', createdAt: new Date().toISOString() };
    const staleScript: PodcastScript = { ...newestScript, title: 'Stale', segments: [{ ...firstSegment, text: 'This stale turn must never replace the new result.' }] };
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => firstResponse)
      .mockResolvedValueOnce(new Response(JSON.stringify(newestScript), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useScriptGeneration());
    let staleGeneration: Promise<void>;
    act(() => { staleGeneration = result.current.generateScript(paper, speakers, settings); });
    await waitFor(() => expect(result.current.isGeneratingScript).toBe(true));
    act(() => result.current.cancelGeneration());

    await act(async () => result.current.generateScript(paper, speakers, settings));
    expect(result.current.script?.segments[0]?.text).toBe(newestSegment.text);

    releaseFirst?.(new Response(JSON.stringify(staleScript), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await act(async () => staleGeneration);
    expect(result.current.script?.segments[0]?.text).toBe(newestSegment.text);
  });
});
