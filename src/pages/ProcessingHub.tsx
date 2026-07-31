import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Check, ExternalLink, FileText, Loader2, Play, RotateCcw, Sparkles, Square, X } from 'lucide-react';
import { Link } from '@/components/Link';
import { useNavigate } from '@/lib/navigation';
import { splitModelRoute } from '@/lib/model-route';
import { AudioTransport } from '@/components/studio/AudioTransport';
import { ConversationSettingsPanel } from '@/components/studio/ConversationSettingsPanel';
import { EpisodeExportPanel } from '@/components/studio/EpisodeExportPanel';
import { ModelRouter } from '@/components/studio/ModelRouter';
import { PrivateAccess } from '@/components/studio/PrivateAccess';
import { DEFAULT_SCRIPT_SPEAKERS } from '@/constants/script-models';
import { useModelCatalog } from '@/hooks/useModelCatalog';
import { usePaperActions } from '@/hooks/usePaperActions';
import { useScriptGeneration } from '@/hooks/useScriptGeneration';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_CONVERSATION_TURNS } from '@shared/conversation';
import type { ConversationSettings, ModelCatalog, ScriptSpeakerConfig, ScriptSpeakerId } from '@shared/research';

function hydrateSpeakers(speakers: ScriptSpeakerConfig[], catalog: ModelCatalog): ScriptSpeakerConfig[] {
  const scriptProvider = catalog.scriptProviders.find((provider) => provider.configured);
  if (!scriptProvider) return speakers;
  const fallbackModel = `${scriptProvider.id}:${scriptProvider.models[0].id}`;

  return speakers.map((speaker) => {
    const { providerId, modelId } = splitModelRoute(speaker.model);
    const selectedScriptProvider = catalog.scriptProviders.find((provider) => provider.id === providerId);
    const scriptRouteIsUsable = Boolean(
      selectedScriptProvider?.configured && selectedScriptProvider.models.some((model) => model.id === modelId),
    );
    const selectedVoiceProvider = catalog.speechProviders.find((provider) => provider.id === speaker.voice?.providerId);
    const selectedVoiceModel = selectedVoiceProvider?.models.find((model) => model.id === speaker.voice?.modelId);
    const voiceRouteIsUsable = Boolean(
      speaker.voice
      && selectedVoiceProvider?.configured
      && selectedVoiceModel
      && (!speaker.voice.voiceId || selectedVoiceModel.voices.some((voice) => voice.id === speaker.voice?.voiceId)),
    );
    return {
      ...speaker,
      model: scriptRouteIsUsable ? speaker.model : fallbackModel,
      voice: voiceRouteIsUsable ? speaker.voice : undefined,
    };
  });
}

const ProcessingHub = () => {
  const { selectedPaper, clearSelectedPaper } = usePaperActions();
  const { catalog, isLoading: modelsLoading, error: modelsError, refresh: refreshModels } = useModelCatalog();
  const {
    generateScript,
    cancelGeneration,
    regenerateVoice,
    downloadProductionJson,
    downloadTextScript,
    downloadEpisode,
    clearScript,
    isGenerating,
    isGeneratingScript,
    isGeneratingVoice,
    isExporting,
    script,
    audioBySegment,
    error,
    hasScript,
  } = useScriptGeneration();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [speakers, setSpeakers] = useState<ScriptSpeakerConfig[]>(DEFAULT_SCRIPT_SPEAKERS);
  const [settings, setSettings] = useState<ConversationSettings>({ turnCount: DEFAULT_CONVERSATION_TURNS });
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number | null>(null);
  const configuredSpeakers = useMemo(() => hydrateSpeakers(speakers, catalog), [speakers, catalog]);
  const effectiveSettings = useMemo<ConversationSettings>(() => ({
    turnCount: Math.min(settings.turnCount, catalog.access.maxConversationTurns),
  }), [catalog.access.maxConversationTurns, settings.turnCount]);
  const modelLabels = useMemo(() => new Map<string, string>(catalog.scriptProviders.flatMap((provider) => (
    provider.models.map((model) => [`${provider.id}:${model.id}`, model.label] as const)
  ))), [catalog.scriptProviders]);

  const handleChangePaper = useCallback(() => {
    clearSelectedPaper();
    clearScript();
    navigate('/');
  }, [clearScript, clearSelectedPaper, navigate]);

  const handleGenerate = useCallback(async () => {
    if (!selectedPaper) return;
    const normalizedNames = configuredSpeakers.map((speaker) => speaker.name.trim());
    if (normalizedNames.some((name) => !name)) {
      toast({ title: 'Name each speaker', description: 'Both speakers need a name.', variant: 'destructive' });
      return;
    }
    if (new Set(normalizedNames.map((name) => name.toLowerCase())).size !== normalizedNames.length) {
      toast({ title: 'Use distinct names', description: 'Each speaker needs a different name.', variant: 'destructive' });
      return;
    }
    if (configuredSpeakers.some((speaker) => !speaker.model)) {
      toast({ title: 'Choose a script model', description: 'Select a configured provider before generating.', variant: 'destructive' });
      return;
    }
    setCurrentAudioIndex(null);
    await generateScript(selectedPaper, configuredSpeakers.map((speaker, index) => ({
      ...speaker,
      id: (index === 0 ? 'speaker_1' : 'speaker_2') as ScriptSpeakerId,
      name: speaker.name.trim(),
    })), effectiveSettings);
  }, [configuredSpeakers, effectiveSettings, generateScript, selectedPaper, toast]);

  const readyAudioCount = useMemo(
    () => Object.values(audioBySegment).filter((audio) => audio.status === 'ready').length,
    [audioBySegment],
  );
  const hasVoiceRouting = configuredSpeakers.some((speaker) => speaker.voice);
  const hasAudioActivity = Object.keys(audioBySegment).length > 0;
  const isDemoMode = configuredSpeakers.every((speaker) => speaker.model.startsWith('demo:'));
  const hasUsableScriptProvider = catalog.scriptProviders.some((provider) => provider.configured);
  const activeTurnCount = script?.settings.turnCount || effectiveSettings.turnCount;
  const scriptIsComplete = Boolean(script && script.segments.length === script.settings.turnCount);

  const episodeStatus = isGeneratingScript
    ? `Writing turn ${Math.min((script?.segments.length || 0) + 1, activeTurnCount)} of ${activeTurnCount}`
    : isGeneratingVoice
      ? `Voicing ${readyAudioCount} of ${script?.segments.length || 0}`
      : hasScript
        ? readyAudioCount > 0 ? 'Episode ready' : 'Script ready'
        : 'Ready to generate';

  if (!selectedPaper) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
        <Link to="/" className="inline-flex min-h-10 items-center gap-2 text-sm text-stone-500 hover:text-stone-950"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <section className="mt-12">
          <h1 className="font-editorial text-4xl text-stone-950">No paper selected</h1>
          <p className="mt-3 text-sm text-stone-500">Choose a paper first, then bring it into the conversation studio.</p>
          <Link to="/" className="mt-7 inline-flex min-h-11 items-center rounded-md bg-stone-950 px-5 text-sm font-medium text-white">Browse papers</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-stone-950">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#fbfaf7]/95 px-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <Link to="/" className="inline-flex min-h-10 items-center gap-2 text-sm text-stone-500 transition-colors hover:text-stone-950"><ArrowLeft className="h-4 w-4" /> Research</Link>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : hasScript ? <Check className="h-3.5 w-3.5" /> : null}
            <span aria-live="polite">{episodeStatus}</span>
          </div>
          <div className="flex items-center gap-3">
            <PrivateAccess authenticated={catalog.access.authenticated} configured={catalog.access.ownerAuthConfigured} onChanged={refreshModels} />
            <button type="button" onClick={handleChangePaper} className="inline-flex min-h-10 items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-950"><X className="h-3.5 w-3.5" /> Change</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl lg:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="border-b border-stone-200 px-5 py-7 sm:px-7 lg:min-h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:py-9">
          <div>
            <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
              <span>{selectedPaper.source}</span>
              <span>{selectedPaper.published_date}</span>
            </div>
            <h1 className="mt-4 font-editorial text-[30px] leading-[1.12] tracking-[-0.025em] text-stone-950">{selectedPaper.title}</h1>
            {selectedPaper.authors?.length ? <p className="mt-3 text-xs leading-5 text-stone-500">{selectedPaper.authors.slice(0, 3).join(', ')}{selectedPaper.authors.length > 3 ? ' et al.' : ''}</p> : null}
            {selectedPaper.summary && <p className="mt-5 line-clamp-3 text-sm leading-6 text-stone-600">{selectedPaper.summary}</p>}
            <a href={selectedPaper.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-9 items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-950">Open paper <ExternalLink className="h-3.5 w-3.5" /></a>

            {modelsLoading ? (
              <div className="mt-8 border-t border-stone-200 pt-6" aria-label="Loading model providers">
                <div className="h-3 w-20 animate-pulse rounded bg-stone-200" />
                <div className="mt-4 h-10 animate-pulse rounded bg-stone-100" />
                <div className="mt-3 h-10 animate-pulse rounded bg-stone-100" />
              </div>
            ) : hasUsableScriptProvider ? (
              <>
                <ModelRouter catalog={catalog} speakers={configuredSpeakers} onChange={setSpeakers} disabled={isGenerating} />
                <ConversationSettingsPanel
                  settings={effectiveSettings}
                  maxTurns={catalog.access.maxConversationTurns}
                  hasVoice={hasVoiceRouting}
                  onChange={setSettings}
                  disabled={isGenerating}
                />
              </>
            ) : (
              <section className="mt-8 border-t border-stone-200 pt-6">
                <h2 className="text-sm font-semibold">Models</h2>
                <p className="mt-2 text-xs leading-5 text-stone-500">No AI provider is configured. Add at least one provider key, then restart the app.</p>
              </section>
            )}

            {(modelsError || error) && <p role="alert" className="mt-5 border-l-2 border-[#7d5066] pl-3 text-xs leading-5 text-stone-600">{modelsError || error}</p>}

            <div className="sticky bottom-0 z-10 -mx-5 mt-5 border-t border-stone-200 bg-[#fbfaf7]/95 px-5 pb-1 pt-4 backdrop-blur sm:-mx-7 sm:px-7">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={cancelGeneration}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-5 text-sm font-medium text-stone-800 transition-colors hover:border-stone-500 hover:text-stone-950"
                >
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> Stop generation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={modelsLoading || !hasUsableScriptProvider}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {hasScript ? 'Generate again' : isDemoMode ? 'Generate sample' : hasVoiceRouting ? 'Generate episode' : 'Generate script'}
                </button>
              )}
              <p className="mt-2 text-center text-[10px] leading-4 text-stone-400">
                {isDemoMode ? 'Demo streams locally without an API key.' : hasVoiceRouting ? 'Script and audio generate progressively.' : 'The script appears one turn at a time.'}
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-7 sm:px-8 sm:py-9 lg:px-12" aria-labelledby="conversation-heading">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7d5066]">Research notebook</p>
                <h2 id="conversation-heading" className="mt-1 font-editorial text-3xl tracking-[-0.02em] text-stone-950">Conversation</h2>
                <p className="mt-2 text-xs text-stone-500">
                  {script?.segments.length || 0} turns{script?.totalDuration && script.totalDuration !== '0:00' ? ` · ${script.totalDuration}` : ''}{readyAudioCount ? ` · ${readyAudioCount} voiced` : ''}
                </p>
              </div>
            </div>

            {isGeneratingScript ? (
              <div className="h-px w-full bg-stone-200" role="progressbar" aria-label="Conversation generation progress" aria-valuemin={0} aria-valuemax={activeTurnCount} aria-valuenow={script?.segments.length || 0}>
                <div className="h-px bg-[#7d5066] transition-[width] duration-300" style={{ width: `${((script?.segments.length || 0) / activeTurnCount) * 100}%` }} />
              </div>
            ) : null}

            {script && scriptIsComplete && !isGeneratingScript && !isGeneratingVoice ? (
              <EpisodeExportPanel
                script={script}
                audioBySegment={audioBySegment}
                isExporting={isExporting}
                onDownloadEpisode={() => void downloadEpisode(script)}
                onDownloadTranscript={() => downloadTextScript(script)}
                onDownloadProduction={() => downloadProductionJson(script)}
              />
            ) : null}

            {!hasScript && !isGeneratingScript ? (
              <div className="flex min-h-[440px] flex-col items-center justify-center py-16 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white"><FileText className="h-4 w-4 text-stone-500" /></div>
                <h3 className="mt-5 font-editorial text-xl text-stone-900">Ready when your cast is</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">Review the two speakers, then generate. Each finished turn appears immediately.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-200" role="log" aria-live="polite" aria-relevant="additions" aria-busy={isGeneratingScript}>
                {script?.segments.map((segment, index) => {
                  const audio = audioBySegment[index] || { status: 'idle' as const };
                  const active = currentAudioIndex === index;
                  return (
                    <article key={`${script.id}-${index}`} className={`transcript-turn -mx-3 px-3 py-6 sm:-mx-4 sm:px-4 ${active ? 'bg-[#f3edf0]' : ''}`}>
                      <div className="grid gap-3 sm:grid-cols-[116px_minmax(0,1fr)_40px]">
                        <div>
                          <p className="flex items-baseline gap-2 text-xs font-semibold text-stone-950"><span className="text-[10px] font-normal tabular-nums text-stone-400">{String(index + 1).padStart(2, '0')}</span>{segment.speaker}</p>
                          <p className="mt-1 truncate text-[11px] text-stone-400">{modelLabels.get(segment.speakerModel) || segment.speakerModel}</p>
                        </div>
                        <p className="text-[15px] leading-7 text-stone-700">{segment.text}</p>
                        <div className="flex items-start justify-end">
                          {audio.status === 'ready' ? (
                            <button type="button" onClick={() => setCurrentAudioIndex(index)} aria-label={`Play turn ${index + 1} by ${segment.speaker}`} className="minimal-icon-button h-9 w-9"><Play className="h-3.5 w-3.5 fill-current" /></button>
                          ) : audio.status === 'generating' ? (
                            <span className="flex h-9 w-9 items-center justify-center text-stone-400" title="Generating voice"><Loader2 className="h-3.5 w-3.5 animate-spin" /></span>
                          ) : audio.status === 'error' ? (
                            <button type="button" onClick={() => regenerateVoice(index)} aria-label={`Retry voice for turn ${index + 1}`} className="minimal-icon-button h-9 w-9"><RotateCcw className="h-3.5 w-3.5" /></button>
                          ) : null}
                        </div>
                      </div>
                      {audio.status === 'error' && <p className="mt-2 pl-0 text-xs text-[#7d5066] sm:pl-[128px]">Voice failed. Retry this turn.</p>}
                    </article>
                  );
                })}

                {isGeneratingScript && (
                  <div className="py-7" aria-label="Writing the next conversation turn">
                    <div className="grid gap-3 sm:grid-cols-[116px_minmax(0,1fr)]">
                      <div className="space-y-2"><div className="h-3 w-16 animate-pulse rounded bg-stone-200" /><div className="h-2.5 w-20 animate-pulse rounded bg-stone-100" /></div>
                      <div className="space-y-2.5"><div className="h-3 w-full animate-pulse rounded bg-stone-100" /><div className="h-3 w-5/6 animate-pulse rounded bg-stone-100" /><div className="h-3 w-2/3 animate-pulse rounded bg-stone-100" /></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {((isGeneratingScript && hasVoiceRouting) || hasAudioActivity) ? (
        <AudioTransport segments={script?.segments || []} audioBySegment={audioBySegment} currentIndex={currentAudioIndex} onCurrentIndexChange={setCurrentAudioIndex} />
      ) : null}
    </div>
  );
};

export default ProcessingHub;
