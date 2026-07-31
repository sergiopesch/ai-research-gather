import { Download, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioState } from '@/hooks/useScriptGeneration';
import type { ScriptSegment } from '@shared/research';

type Props = {
  segments: ScriptSegment[];
  audioBySegment: Record<number, AudioState>;
  currentIndex: number | null;
  onCurrentIndexChange: (index: number | null) => void;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
};

export function AudioTransport({ segments, audioBySegment, currentIndex, onCurrentIndexChange }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playable = useMemo(() => Object.entries(audioBySegment).filter(([, state]) => state.status === 'ready' && state.url).map(([index]) => Number(index)).sort((a, b) => a - b), [audioBySegment]);
  const resolvedIndex = currentIndex !== null && audioBySegment[currentIndex]?.url ? currentIndex : null;

  const playIndex = useCallback((index: number) => {
    const audio = audioRef.current;
    const url = audioBySegment[index]?.url;
    if (!audio || !url) return;
    onCurrentIndexChange(index);
    if (audio.src !== url) {
      audio.src = url;
      audio.load();
    }
    void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [audioBySegment, onCurrentIndexChange]);

  useEffect(() => {
    if (resolvedIndex === null) return;
    const audio = audioRef.current;
    const url = audioBySegment[resolvedIndex]?.url;
    if (!audio || !url || audio.src === url) return;
    audio.src = url;
    audio.load();
    void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [audioBySegment, resolvedIndex]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      const index = resolvedIndex ?? playable[0];
      if (index !== undefined) playIndex(index);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const move = (direction: -1 | 1) => {
    if (!playable.length) return;
    const position = resolvedIndex === null ? -1 : playable.indexOf(resolvedIndex);
    const nextPosition = Math.min(playable.length - 1, Math.max(0, position + direction));
    playIndex(playable[nextPosition]);
  };

  const handleEnded = () => {
    const position = resolvedIndex === null ? -1 : playable.indexOf(resolvedIndex);
    if (position >= 0 && position < playable.length - 1) playIndex(playable[position + 1]);
    else setIsPlaying(false);
  };

  const downloadCurrent = () => {
    if (resolvedIndex === null) return;
    const url = audioBySegment[resolvedIndex]?.url;
    if (!url) return;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `turn-${resolvedIndex + 1}-${segments[resolvedIndex]?.speaker || 'speaker'}.mp3`;
    anchor.click();
  };

  return (
    <div className="sticky bottom-0 z-20 border-t border-stone-200 bg-[#fbfaf7]/95 px-4 py-3 backdrop-blur sm:px-6">
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
      />
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <button type="button" onClick={() => move(-1)} disabled={!playable.length} aria-label="Previous turn" className="transport-button"><SkipBack className="h-4 w-4" /></button>
        <button type="button" onClick={toggle} disabled={!playable.length} aria-label={isPlaying ? 'Pause episode' : 'Play episode'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white transition-colors hover:bg-stone-800 disabled:bg-stone-300">
          {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
        </button>
        <button type="button" onClick={() => move(1)} disabled={!playable.length} aria-label="Next turn" className="transport-button"><SkipForward className="h-4 w-4" /></button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-stone-500">
            <span className="truncate">{resolvedIndex === null ? (playable.length ? 'Ready to play' : 'Audio appears here as it is generated') : `${segments[resolvedIndex]?.speaker} · Turn ${resolvedIndex + 1}`}</span>
            <span className="shrink-0 tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <input
            aria-label="Audio position"
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            disabled={!duration}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (audioRef.current) audioRef.current.currentTime = next;
              setCurrentTime(next);
            }}
            className="block h-1.5 w-full accent-stone-950 disabled:opacity-30"
          />
        </div>
        <button type="button" onClick={downloadCurrent} disabled={resolvedIndex === null} aria-label="Download current turn" className="transport-button"><Download className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
