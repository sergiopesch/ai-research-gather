import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createEpisodeArchive, episodeArchiveName, productionJson, transcriptText } from '@/lib/episode-export';
import type { ConversationSettings, Paper, PodcastScript, ScriptSegment, ScriptSpeakerConfig } from '@shared/research';

export type AudioState = {
  status: 'idle' | 'generating' | 'ready' | 'error';
  url?: string;
  blob?: Blob;
  mediaType?: string;
  error?: string;
};

type ScriptStreamEvent =
  | { type: 'start'; totalTurns: number; notice?: string }
  | { type: 'segment'; index: number; segment: ScriptSegment }
  | { type: 'complete'; script: PodcastScript }
  | { type: 'error'; message: string };

const normalizeSegmentText = (text: string): string => text.replace(/^[\w .'-]{1,48}:\s*/i, '').trim();
const normalizeSegment = (segment: ScriptSegment): ScriptSegment => ({
  ...segment,
  text: normalizeSegmentText(segment.text),
});

async function responseError(response: Response, action: string): Promise<string> {
  const fallback = `${action} failed (${response.status})`;
  const responseText = await response.text();
  if (!responseText) return fallback;
  try {
    const parsed = JSON.parse(responseText) as { error?: string };
    return parsed.error ? `${fallback}: ${parsed.error}` : fallback;
  } catch {
    return `${fallback}: ${responseText.slice(0, 240)}`;
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export const useScriptGeneration = () => {
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [script, setScript] = useState<PodcastScript | null>(null);
  const [audioBySegment, setAudioBySegment] = useState<Record<number, AudioState>>({});
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const generationActive = useRef(false);
  const generationIdRef = useRef(0);
  const generationController = useRef<AbortController | null>(null);
  const objectUrls = useRef(new Set<string>());
  const { toast } = useToast();

  const revokeAudio = useCallback(() => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current.clear();
    setAudioBySegment({});
  }, []);

  useEffect(() => () => {
    generationIdRef.current += 1;
    generationController.current?.abort();
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const generateVoice = useCallback(async (
    index: number,
    segment: ScriptSegment,
    speaker: ScriptSpeakerConfig,
    signal?: AbortSignal,
    generationId?: number,
  ) => {
    if (!speaker.voice) return;
    if (generationId !== undefined && generationId !== generationIdRef.current) return;
    setAudioBySegment((current) => ({ ...current, [index]: { status: 'generating' } }));

    try {
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: segment.text, ...speaker.voice }),
        signal,
      });
      if (!response.ok) throw new Error(await responseError(response, 'Voice generation'));
      const blob = await response.blob();
      if (generationId !== undefined && generationId !== generationIdRef.current) return;
      const url = URL.createObjectURL(blob);
      objectUrls.current.add(url);
      setAudioBySegment((current) => {
        const previousUrl = current[index]?.url;
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
          objectUrls.current.delete(previousUrl);
        }
        return {
          ...current,
          [index]: {
            status: 'ready',
            url,
            blob,
            mediaType: blob.type || response.headers.get('content-type') || 'audio/mpeg',
          },
        };
      });
    } catch (cause: unknown) {
      if (generationId !== undefined && generationId !== generationIdRef.current) return;
      if (cause instanceof DOMException && cause.name === 'AbortError') {
        setAudioBySegment((current) => {
          const next = { ...current };
          delete next[index];
          return next;
        });
        return;
      }
      setAudioBySegment((current) => ({
        ...current,
        [index]: { status: 'error', error: cause instanceof Error ? cause.message : 'Voice generation failed' },
      }));
    }
  }, []);

  const generateScript = useCallback(async (paper: Paper, speakers: ScriptSpeakerConfig[], settings: ConversationSettings) => {
    if (generationActive.current) return;
    generationActive.current = true;
    const generationId = generationIdRef.current + 1;
    generationIdRef.current = generationId;
    generationController.current?.abort();
    const controller = new AbortController();
    generationController.current = controller;
    revokeAudio();
    setIsGeneratingScript(true);
    setError(null);
    setScript({
      id: paper.id,
      title: `The Notebook Pod: ${paper.title}`,
      settings,
      speakers,
      segments: [],
      totalDuration: '0:00',
      createdAt: new Date().toISOString(),
    });

    const voiceQueue: Array<() => Promise<void>> = [];
    let generationNotice: string | undefined;
    let activeVoiceJobs = 0;
    let queuedVoiceJobs = 0;
    let voiceQueueClosed = false;
    let resolveVoiceDrain: () => void = () => undefined;
    const voiceDrain = new Promise<void>((resolve) => { resolveVoiceDrain = resolve; });

    const finishVoiceDrain = () => {
      if (voiceQueueClosed && activeVoiceJobs === 0 && voiceQueue.length === 0) resolveVoiceDrain();
    };

    const pumpVoiceQueue = () => {
      while (activeVoiceJobs < 2 && voiceQueue.length > 0) {
        const job = voiceQueue.shift();
        if (!job) break;
        activeVoiceJobs += 1;
        void job().finally(() => {
          activeVoiceJobs -= 1;
          pumpVoiceQueue();
          finishVoiceDrain();
        });
      }
    };

    const queueVoice = (index: number, segment: ScriptSegment) => {
      const speaker = speakers.find((item) => item.id === segment.speakerId);
      if (!speaker?.voice) return;
      queuedVoiceJobs += 1;
      voiceQueue.push(() => generateVoice(index, segment, speaker, controller.signal, generationId));
      pumpVoiceQueue();
    };

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify({ paper, speakers, settings }),
        signal: controller.signal,
      });
      if (generationId !== generationIdRef.current) return;
      if (!response.ok) throw new Error(await responseError(response, 'Script generation'));

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/x-ndjson') || !response.body) {
        const completeScript = (await response.json()) as PodcastScript;
        if (generationId !== generationIdRef.current) return;
        const normalized = { ...completeScript, segments: completeScript.segments.map(normalizeSegment) };
        generationNotice = normalized.generationNotice;
        setScript(normalized);
        for (const [index, segment] of normalized.segments.entries()) queueVoice(index, segment);
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let completeScript: PodcastScript | null = null;

        const processLine = (line: string) => {
          if (!line.trim()) return;
          if (generationId !== generationIdRef.current) return;
          const event = JSON.parse(line) as ScriptStreamEvent;
          if (event.type === 'error') throw new Error(event.message);
          if (event.type === 'start' && event.notice) generationNotice = event.notice;
          if (event.type === 'segment') {
            const segment = normalizeSegment(event.segment);
            setScript((current) => current ? { ...current, segments: [...current.segments, segment] } : current);
            queueVoice(event.index, segment);
          }
          if (event.type === 'complete') completeScript = event.script;
        };

        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) processLine(line);
          if (done) break;
        }
        if (buffer.trim()) processLine(buffer);
        if (completeScript) {
          const finalized = completeScript as PodcastScript;
          generationNotice = finalized.generationNotice;
          setScript({ ...finalized, segments: finalized.segments.map(normalizeSegment) });
        }
      }

      setIsGeneratingScript(false);
      voiceQueueClosed = true;
      finishVoiceDrain();
      if (queuedVoiceJobs > 0) await voiceDrain;
      if (generationId !== generationIdRef.current) return;
      toast({
        title: generationNotice ? 'Grounded fallback used' : 'Episode ready',
        description: generationNotice || (speakers.some((speaker) => speaker.voice)
          ? 'The conversation and available voices are ready to play.'
          : 'The conversation is ready. Add a voice provider to generate audio.'),
      });
    } catch (cause: unknown) {
      if (generationId !== generationIdRef.current) return;
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      controller.abort();
      voiceQueue.length = 0;
      revokeAudio();
      const message = cause instanceof Error ? cause.message : 'Episode generation failed';
      setError(message);
      toast({ title: 'Generation stopped', description: message, variant: 'destructive' });
    } finally {
      if (generationId === generationIdRef.current) {
        generationActive.current = false;
        setIsGeneratingScript(false);
      }
    }
  }, [generateVoice, revokeAudio, toast]);

  const regenerateVoice = useCallback(async (index: number) => {
    const segment = script?.segments[index];
    const speaker = script?.speakers.find((item) => item.id === segment?.speakerId);
    if (!segment || !speaker?.voice) return;
    await generateVoice(index, segment, speaker, undefined, generationIdRef.current);
  }, [generateVoice, script]);

  const cancelGeneration = useCallback(() => {
    if (!generationActive.current) return;
    generationIdRef.current += 1;
    generationController.current?.abort();
    generationActive.current = false;
    setIsGeneratingScript(false);
    setAudioBySegment((current) => Object.fromEntries(
      Object.entries(current).filter(([, audio]) => audio.status !== 'generating'),
    ));
    toast({ title: 'Generation stopped', description: 'Completed conversation turns have been kept.' });
  }, [toast]);

  const downloadProductionJson = useCallback((value: PodcastScript) => {
    triggerDownload(new Blob([productionJson(value)], { type: 'application/json' }), `episode-${value.id}.json`);
    toast({ title: 'Production file downloaded', description: 'Includes model and voice routing for every speaker.' });
  }, [toast]);

  const downloadTextScript = useCallback((value: PodcastScript) => {
    triggerDownload(new Blob([transcriptText(value)], { type: 'text/plain' }), `episode-${value.id}.txt`);
    toast({ title: 'Transcript downloaded', description: 'The complete conversation is ready as a text file.' });
  }, [toast]);

  const downloadEpisode = useCallback(async (value: PodcastScript) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const archive = await createEpisodeArchive(value, audioBySegment);
      triggerDownload(archive, episodeArchiveName(value));
      const clipCount = Object.values(audioBySegment).filter((audio) => audio.status === 'ready' && audio.blob).length;
      toast({
        title: 'Episode downloaded',
        description: `The package includes the transcript, production file${clipCount ? `, and ${clipCount} voice clip${clipCount === 1 ? '' : 's'}` : ''}.`,
      });
    } catch (cause: unknown) {
      toast({
        title: 'Export could not be created',
        description: cause instanceof Error ? cause.message : 'Please try the export again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [audioBySegment, isExporting, toast]);

  const clearScript = useCallback(() => {
    generationIdRef.current += 1;
    generationController.current?.abort();
    generationActive.current = false;
    revokeAudio();
    setScript(null);
    setError(null);
    setIsGeneratingScript(false);
  }, [revokeAudio]);

  const isGeneratingVoice = useMemo(
    () => Object.values(audioBySegment).some((audio) => audio.status === 'generating'),
    [audioBySegment],
  );

  return {
    generateScript,
    cancelGeneration,
    regenerateVoice,
    downloadProductionJson,
    downloadTextScript,
    downloadEpisode,
    clearScript,
    isGenerating: isGeneratingScript || isGeneratingVoice,
    isGeneratingScript,
    isGeneratingVoice,
    isExporting,
    script,
    audioBySegment,
    error,
    hasScript: Boolean(script?.segments.length),
  };
};
