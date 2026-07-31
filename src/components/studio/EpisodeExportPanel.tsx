import { Check, Download, FileJson, FileText, Loader2 } from 'lucide-react';
import type { AudioState } from '@/hooks/useScriptGeneration';
import type { PodcastScript } from '@shared/research';

type Props = {
  script: PodcastScript;
  audioBySegment: Record<number, AudioState>;
  isExporting: boolean;
  onDownloadEpisode: () => void;
  onDownloadTranscript: () => void;
  onDownloadProduction: () => void;
};

export function EpisodeExportPanel({
  script,
  audioBySegment,
  isExporting,
  onDownloadEpisode,
  onDownloadTranscript,
  onDownloadProduction,
}: Props) {
  const voicedSpeakers = new Set(script.speakers.filter((speaker) => speaker.voice).map((speaker) => speaker.id));
  const expectedAudioCount = script.segments.filter((segment) => voicedSpeakers.has(segment.speakerId)).length;
  const readyAudioCount = Object.values(audioBySegment).filter((audio) => audio.status === 'ready' && audio.blob).length;
  const failedAudioCount = Object.values(audioBySegment).filter((audio) => audio.status === 'error').length;
  const hasAudio = readyAudioCount > 0;
  const audioSummary = expectedAudioCount
    ? `${readyAudioCount} of ${expectedAudioCount} voice clips${failedAudioCount ? ` · ${failedAudioCount} need${failedAudioCount === 1 ? 's' : ''} attention` : ''}`
    : 'Transcript and production settings';

  return (
    <section className="research-state my-5 border border-stone-200 bg-white px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5" aria-labelledby="episode-export-heading">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3edf0] text-[#7d5066]">
          <Check className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 id="episode-export-heading" className="text-sm font-semibold text-stone-950">Ready to export</h3>
          <p className="mt-1 text-xs leading-5 text-stone-500">{script.segments.length} turns · {audioSummary}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 pl-11 sm:mt-0 sm:flex sm:shrink-0 sm:items-center sm:gap-1 sm:pl-0">
        <button
          type="button"
          onClick={hasAudio ? onDownloadEpisode : onDownloadTranscript}
          disabled={isExporting}
          className="motion-control col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-xs font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-wait disabled:bg-stone-400"
        >
          {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : hasAudio ? <Download className="h-3.5 w-3.5" aria-hidden="true" /> : <FileText className="h-3.5 w-3.5" aria-hidden="true" />}
          {isExporting ? 'Preparing…' : hasAudio ? 'Download episode' : 'Download transcript'}
        </button>
        {hasAudio ? (
          <button type="button" onClick={onDownloadTranscript} className="inline-flex min-h-9 items-center justify-center gap-1.5 px-1 text-[11px] font-medium text-stone-500 transition-colors hover:text-stone-950" aria-label="Download transcript"><FileText className="h-3.5 w-3.5" /> Transcript</button>
        ) : null}
        <button type="button" onClick={onDownloadProduction} className="inline-flex min-h-9 items-center justify-center gap-1.5 px-1 text-[11px] font-medium text-stone-500 transition-colors hover:text-stone-950" aria-label="Download production file"><FileJson className="h-3.5 w-3.5" /> Production</button>
      </div>
    </section>
  );
}
