import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScriptSpeakerConfig } from '@shared/research';

type PreviewStatus = 'idle' | 'loading' | 'playing' | 'error';

async function previewError(response: Response): Promise<string> {
  const fallback = `Voice preview failed (${response.status})`;
  const text = await response.text();
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text) as { error?: string };
    return parsed.error || fallback;
  } catch {
    return fallback;
  }
}

export function useVoicePreview() {
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const releasePreview = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => releasePreview(), [releasePreview]);

  const stop = useCallback(() => {
    releasePreview();
    setStatus('idle');
    setError(null);
  }, [releasePreview]);

  const preview = useCallback(async (speaker: ScriptSpeakerConfig) => {
    if (!speaker.voice) return;
    releasePreview();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Hello, I’m ${speaker.name}. Let’s explore this paper together.`,
          ...speaker.voice,
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(await previewError(response));
      const blob = await response.blob();
      if (controller.signal.aborted) return;

      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setStatus('idle');
      audio.onerror = () => {
        setStatus('error');
        setError('The preview could not be played.');
      };
      await audio.play();
      setStatus('playing');
    } catch (cause: unknown) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Voice preview failed.');
    }
  }, [releasePreview]);

  return { status, error, preview, stop };
}
