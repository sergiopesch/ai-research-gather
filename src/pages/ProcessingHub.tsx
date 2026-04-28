import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle, Download, ExternalLink, FileDown, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DEFAULT_SCRIPT_SPEAKERS, SCRIPT_MODEL_OPTIONS } from '@/constants/script-models';
import { usePaperActions } from '@/hooks/usePaperActions';
import { useScriptGeneration } from '@/hooks/useScriptGeneration';
import { useToast } from '@/hooks/use-toast';
import type { ScriptSegment } from '@/hooks/useScriptGeneration';
import type { ScriptModel, ScriptSpeakerConfig, ScriptSpeakerId } from '@/types/research';

const STREAM_CHARS_PER_TICK = 5;

interface StreamingSegmentProps {
  segment: ScriptSegment;
  active: boolean;
  complete: boolean;
  onDone: () => void;
}

const StreamingSegment = ({ segment, active, complete, onDone }: StreamingSegmentProps) => {
  const [visibleText, setVisibleText] = useState(complete ? segment.text : '');

  useEffect(() => {
    if (complete) {
      setVisibleText(segment.text);
      return;
    }

    if (!active) {
      setVisibleText('');
      return;
    }

    setVisibleText('');
    let index = 0;
    const interval = window.setInterval(() => {
      index = Math.min(index + STREAM_CHARS_PER_TICK, segment.text.length);
      setVisibleText(segment.text.slice(0, index));

      if (index >= segment.text.length) {
        window.clearInterval(interval);
        onDone();
      }
    }, 24);

    return () => window.clearInterval(interval);
  }, [active, complete, onDone, segment.text]);

  return (
    <article className="rounded-lg border border-neutral-200 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500">
        <span>{segment.speaker}</span>
        <span className="font-medium text-neutral-400">{segment.speakerModel}</span>
      </div>
      <p className="min-h-14 text-sm leading-7 text-neutral-700">
        {visibleText}
        {active && !complete && <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-neutral-900 align-middle" />}
      </p>
    </article>
  );
};

const ProcessingHub = () => {
  const { selectedPaper, hasSelectedPaper, clearSelectedPaper } = usePaperActions();
  const {
    generateScript,
    downloadElevenLabsScript,
    downloadTextScript,
    clearScript,
    isGenerating,
    script,
    error,
    hasScript,
  } = useScriptGeneration();
  const { toast } = useToast();
  const navigate = useNavigate();
  const scriptRef = useRef<HTMLDivElement | null>(null);
  const [speakers, setSpeakers] = useState<ScriptSpeakerConfig[]>(DEFAULT_SCRIPT_SPEAKERS);
  const [visibleSegmentCount, setVisibleSegmentCount] = useState(0);

  const handleChangePaper = useCallback(() => {
    clearSelectedPaper();
    clearScript();
    navigate('/');
  }, [clearScript, clearSelectedPaper, navigate]);

  const handleGenerateScript = useCallback(async () => {
    if (!selectedPaper) {
      toast({
        title: "No paper selected",
        description: "Choose a paper first.",
        variant: "destructive",
      });
      return;
    }

    const normalizedNames = speakers.map((speaker) => speaker.name.trim());
    if (normalizedNames.some((name) => name.length === 0)) {
      toast({
        title: "Name each speaker",
        description: "Both speakers need a name.",
        variant: "destructive",
      });
      return;
    }

    if (new Set(normalizedNames.map((name) => name.toLowerCase())).size !== normalizedNames.length) {
      toast({
        title: "Use distinct names",
        description: "Each speaker needs a different name.",
        variant: "destructive",
      });
      return;
    }

    await generateScript(
      selectedPaper,
      speakers.map((speaker, index) => ({
        ...speaker,
        id: (index === 0 ? 'speaker_1' : 'speaker_2') as ScriptSpeakerId,
        name: speaker.name.trim(),
      })),
    );
  }, [generateScript, selectedPaper, speakers, toast]);

  useEffect(() => {
    if (hasScript) {
      setVisibleSegmentCount(0);
      scriptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasScript]);

  const handleSegmentDone = useCallback(() => {
    setVisibleSegmentCount((current) => current + 1);
  }, []);

  const updateSpeaker = useCallback((id: ScriptSpeakerId, updates: Partial<ScriptSpeakerConfig>) => {
    setSpeakers((current) =>
      current.map((speaker) => (speaker.id === id ? { ...speaker, ...updates } : speaker)),
    );
  }, []);

  if (!hasSelectedPaper) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <section className="mt-10">
          <h1 className="text-display text-neutral-950">No paper selected</h1>
          <p className="mt-3 text-sm text-neutral-500">Pick a paper from discovery to generate a script.</p>
          <Link to="/" className="comet-button mt-6 inline-flex text-sm">
            Browse papers
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <button
          type="button"
          onClick={handleChangePaper}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-950"
        >
          <X className="h-3.5 w-3.5" />
          Change
        </button>
      </div>

      <section className="comet-card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
          <span>{selectedPaper.source}</span>
          <span>{selectedPaper.published_date}</span>
          <a
            href={selectedPaper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-neutral-700 hover:text-neutral-950"
          >
            View
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <h1 className="text-2xl font-medium leading-tight text-neutral-950 sm:text-3xl">
          {selectedPaper.title}
        </h1>

        {selectedPaper.summary && (
          <p className="mt-5 line-clamp-3 text-sm leading-7 text-neutral-600">
            {selectedPaper.summary}
          </p>
        )}

        <div className="mt-6">
          {!hasScript && !isGenerating && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {speakers.map((speaker, index) => (
                  <div key={speaker.id} className="rounded-lg border border-neutral-200 p-3">
                    <div className="mb-2 text-xs font-medium text-neutral-500">Speaker {index + 1}</div>
                    <input
                      value={speaker.name}
                      onChange={(event) => updateSpeaker(speaker.id, { name: event.target.value })}
                      maxLength={40}
                      className="mb-2 min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 outline-none transition-colors hover:border-neutral-400 focus:border-neutral-950"
                      aria-label={`Speaker ${index + 1} name`}
                    />
                    <select
                      value={speaker.model}
                      onChange={(event) => updateSpeaker(speaker.id, { model: event.target.value as ScriptModel })}
                      className="min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 outline-none transition-colors hover:border-neutral-400 focus:border-neutral-950"
                      aria-label={`Speaker ${index + 1} model`}
                    >
                      {SCRIPT_MODEL_OPTIONS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleGenerateScript}
                className="comet-button inline-flex items-center gap-2 text-sm"
              >
                <Sparkles className="h-4 w-4" />
                Generate script
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-neutral-100 px-6 py-3 text-sm font-medium text-neutral-500"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating
              </button>
            </div>
          )}

          {hasScript && !isGenerating && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => downloadElevenLabsScript(script!)}
                className="comet-button inline-flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                ElevenLabs
              </button>
              <button
                type="button"
                onClick={() => downloadTextScript(script!)}
                className="comet-button-secondary inline-flex items-center gap-2 text-sm"
              >
                <FileDown className="h-4 w-4" />
                Text
              </button>
              <button
                type="button"
                onClick={clearScript}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-950"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-sm text-neutral-700">{error}</p>
          </div>
        )}
      </section>

      {hasScript && (
        <section ref={scriptRef} className="mt-6 scroll-mt-6 space-y-3">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-neutral-950">
            <CheckCircle className="h-4 w-4" />
            Script ready
          </div>

          {script!.segments.map((segment, index) => (
            <StreamingSegment
              key={`${script!.id}-${index}`}
              segment={segment}
              active={index === visibleSegmentCount}
              complete={index < visibleSegmentCount}
              onDone={handleSegmentDone}
            />
          ))}
        </section>
      )}
    </main>
  );
};

export default ProcessingHub;
