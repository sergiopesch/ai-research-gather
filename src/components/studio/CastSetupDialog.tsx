import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Loader2, LockKeyhole, Play, Square, Volume2, VolumeX, X } from 'lucide-react';
import { ProviderMark } from '@/components/studio/ProviderMark';
import { useVoicePreview } from '@/hooks/useVoicePreview';
import { splitModelRoute } from '@/lib/model-route';
import type { ModelCatalog, ProviderOption, ScriptSpeakerConfig } from '@shared/research';

type Props = {
  open: boolean;
  catalog: ModelCatalog;
  speakers: ScriptSpeakerConfig[];
  onChange: (speakers: ScriptSpeakerConfig[]) => void;
  onClose: () => void;
};

type ProviderSummary = Pick<ProviderOption, 'id' | 'label' | 'configured' | 'configurationKey' | 'setupHint' | 'availability'>;

const STEP_COUNT = 4;
const DELIVERY_OPTIONS = [
  { label: 'Natural', value: '' },
  { label: 'Warm', value: 'Speak warmly and conversationally.' },
  { label: 'Clear', value: 'Speak clearly with precise emphasis.' },
  { label: 'Measured', value: 'Speak thoughtfully at a measured cadence.' },
] as const;

const wordmarkOnly = (providerId: string) => ['xai', 'grok', 'lmnt'].includes(providerId);

function providerStatus(provider: ProviderSummary): string {
  if (provider.availability === 'free') return provider.configured ? 'Free' : 'Unavailable';
  if (provider.availability === 'demo') return 'Sample';
  if (provider.availability === 'subscription') return provider.configured ? 'Plan ready' : 'Login needed';
  return provider.configured ? 'Ready' : 'Key needed';
}

function providerGuidance(catalog: ModelCatalog, provider: ProviderSummary, kind: 'script' | 'voice'): string {
  if (provider.configured) {
    if (provider.availability === 'free') return `${provider.label} is free in this public studio and needs no setup.`;
    if (provider.availability === 'subscription') return `${provider.label} is ready through the authenticated command-line session on this machine. The login stays local.`;
    if (provider.availability === 'demo') return 'The sample route stays grounded in the selected paper and does not call an external model.';
    if (catalog.mode === 'owner-cloud') return `${provider.label} is ready in your private studio. Its API key stays on the server and is never sent to the browser.`;
    return `${provider.label} is ready with the API key configured on this machine.`;
  }

  if (provider.setupHint) return provider.setupHint;
  const key = provider.configurationKey || 'the provider API key';
  if (provider.availability === 'subscription') return `Install and sign in to ${provider.label} locally, then restart the studio. Subscription credentials never enter this app.`;
  if (catalog.mode === 'hosted-free') {
    return `${provider.label} ${kind} is intentionally locked in the public studio. Use the private studio when ${key} is configured on the server, or run the repository locally and add your own key to .env.local.`;
  }
  if (catalog.mode === 'owner-cloud') return `This private server does not currently have ${key}. Add it to the Vercel environment and redeploy to unlock ${provider.label}.`;
  return `Add ${key} to .env.local, restart the studio, and ${provider.label} will unlock automatically.`;
}

function ProviderGrid({
  label,
  providers,
  selectedProviderId,
  inspectedProviderId,
  onChoose,
}: {
  label: string;
  providers: ProviderSummary[];
  selectedProviderId?: string;
  inspectedProviderId?: string;
  onChoose: (providerId: string) => void;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-stone-950">Choose a provider</h3>
        <span className="text-[10px] text-stone-400">{label}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={label}>
        {providers.map((provider) => {
          const selected = provider.id === selectedProviderId;
          const inspected = provider.id === inspectedProviderId;
          const locked = !provider.configured;
          const markOnly = wordmarkOnly(provider.id);
          return (
            <button
              key={provider.id}
              type="button"
              aria-pressed={selected}
              aria-label={`${provider.label} · ${providerStatus(provider)}`}
              onClick={() => onChoose(provider.id)}
              className={`min-h-[76px] rounded-md border p-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.99] ${
                selected
                  ? 'border-stone-950 bg-white'
                  : inspected
                    ? 'border-[#b58ca0] bg-[#faf6f8]'
                    : 'border-stone-200 bg-white hover:border-stone-400'
              }`}
            >
              <span className="flex items-center gap-2">
                <ProviderMark providerId={provider.id} className={markOnly ? '' : 'h-4 w-4'} />
                {!markOnly ? <span className={`truncate text-xs font-semibold ${locked ? 'text-stone-500' : 'text-stone-900'}`}>{provider.label}</span> : null}
                {selected ? <Check className="ml-auto h-3.5 w-3.5 text-[#7d5066]" aria-hidden="true" /> : locked ? <LockKeyhole className="ml-auto h-3.5 w-3.5 text-stone-400" aria-hidden="true" /> : null}
              </span>
              <span className={`mt-3 block text-[10px] font-medium ${provider.availability === 'free' ? 'text-[#7d5066]' : locked ? 'text-stone-400' : 'text-stone-500'}`}>
                {providerStatus(provider)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Guidance({ catalog, provider, kind }: { catalog: ModelCatalog; provider?: ProviderSummary; kind: 'script' | 'voice' }) {
  if (!provider) return null;
  return (
    <div className={`mt-3 rounded-md border px-4 py-3 ${provider.configured ? 'border-stone-200 bg-stone-50' : 'border-[#ddcbd4] bg-[#f8f3f5]'}`} role="status">
      <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-stone-500">
        {provider.configured ? 'Available now' : `Unlock ${provider.label}`}
      </p>
      <p className="text-xs leading-5 text-stone-600">{providerGuidance(catalog, provider, kind)}</p>
      {!provider.configured ? (
        <a href={catalog.repositoryUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-7 items-center gap-1.5 text-xs font-semibold text-stone-800 transition-colors hover:text-[#7d5066]">
          Local setup guide <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

function ScriptStep({
  catalog,
  speaker,
  onPatch,
}: {
  catalog: ModelCatalog;
  speaker: ScriptSpeakerConfig;
  onPatch: (patch: Partial<ScriptSpeakerConfig>) => void;
}) {
  const route = splitModelRoute(speaker.model);
  const [inspectedProviderId, setInspectedProviderId] = useState(route.providerId);
  const selectedProvider = catalog.scriptProviders.find((provider) => provider.id === route.providerId);
  const inspectedProvider = catalog.scriptProviders.find((provider) => provider.id === inspectedProviderId);

  const chooseProvider = (providerId: string) => {
    setInspectedProviderId(providerId);
    const provider = catalog.scriptProviders.find((item) => item.id === providerId);
    const model = provider?.models[0];
    if (provider?.configured && model) onPatch({ model: `${provider.id}:${model.id}` });
  };

  return (
    <>
      <label className="block text-[10px] font-semibold uppercase tracking-[0.13em] text-stone-500" htmlFor={`${speaker.id}-guided-name`}>Speaker name</label>
      <input
        id={`${speaker.id}-guided-name`}
        value={speaker.name}
        maxLength={40}
        onChange={(event) => onPatch({ name: event.target.value })}
        className="mt-1 min-h-10 w-full border-0 border-b border-stone-300 bg-transparent px-0 text-base font-medium text-stone-950 outline-none transition-colors focus:border-stone-950"
      />

      <ProviderGrid
        label={`Script provider for ${speaker.name}`}
        providers={catalog.scriptProviders}
        selectedProviderId={route.providerId}
        inspectedProviderId={inspectedProviderId}
        onChoose={chooseProvider}
      />
      <Guidance catalog={catalog} provider={inspectedProvider} kind="script" />

      {selectedProvider?.configured ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-stone-950">Choose the model</h3>
          <p className="mt-1 text-xs leading-5 text-stone-500">This model writes only {speaker.name}’s turns, so the two speakers can use different routes.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={`Script model for ${speaker.name}`}>
            {selectedProvider.models.map((model) => {
              const selected = model.id === route.modelId;
              return (
                <button
                  key={model.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onPatch({ model: `${selectedProvider.id}:${model.id}` })}
                  className={`min-h-[66px] rounded-md border px-4 py-3 text-left transition-colors ${selected ? 'border-stone-950 bg-white' : 'border-stone-200 bg-white hover:border-stone-400'}`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-stone-900">{model.label}{selected ? <Check className="ml-auto h-3.5 w-3.5 text-[#7d5066]" aria-hidden="true" /> : null}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-stone-500">{model.description || 'Available for this speaker’s script.'}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}

function VoiceStep({
  catalog,
  speaker,
  speakerIndex,
  onPatch,
}: {
  catalog: ModelCatalog;
  speaker: ScriptSpeakerConfig;
  speakerIndex: number;
  onPatch: (patch: Partial<ScriptSpeakerConfig>) => void;
}) {
  const [inspectedProviderId, setInspectedProviderId] = useState(speaker.voice?.providerId || 'off');
  const { status, error, preview, stop } = useVoicePreview();
  const provider = catalog.speechProviders.find((item) => item.id === speaker.voice?.providerId);
  const inspectedProvider = catalog.speechProviders.find((item) => item.id === inspectedProviderId);
  const model = provider?.models.find((item) => item.id === speaker.voice?.modelId);

  useEffect(() => () => stop(), [stop]);

  const chooseProvider = (providerId: string) => {
    setInspectedProviderId(providerId);
    const nextProvider = catalog.speechProviders.find((item) => item.id === providerId);
    const nextModel = nextProvider?.models[0];
    if (!nextProvider?.configured || !nextModel) return;
    onPatch({
      voice: {
        providerId,
        modelId: nextModel.id,
        voiceId: nextModel.voices[speakerIndex % Math.max(nextModel.voices.length, 1)]?.id || undefined,
        speed: speaker.voice?.speed || 1,
        instructions: speaker.voice?.instructions,
      },
    });
  };

  const turnOff = () => {
    stop();
    setInspectedProviderId('off');
    onPatch({ voice: undefined });
  };

  return (
    <>
      <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-stone-900"><Volume2 className="h-4 w-4 text-stone-500" aria-hidden="true" /> Voice is optional</p>
        <p className="mt-1 text-xs leading-5 text-stone-500">Script generation works without voice. Voice providers may have separate usage limits or charges.</p>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-semibold text-stone-950">Choose a voice provider</h3>
          <span className="text-[10px] text-stone-400">For {speaker.name}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" aria-pressed={!speaker.voice} onClick={turnOff} className={`min-h-[76px] rounded-md border p-3 text-left transition-colors ${!speaker.voice ? 'border-stone-950 bg-white' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
            <span className="flex items-center gap-2 text-xs font-semibold text-stone-900"><VolumeX className="h-4 w-4 text-stone-500" aria-hidden="true" /> No generated voice{!speaker.voice ? <Check className="ml-auto h-3.5 w-3.5 text-[#7d5066]" /> : null}</span>
            <span className="mt-3 block text-[10px] font-medium text-stone-500">Script only</span>
          </button>
          {catalog.speechProviders.map((item) => {
            const selected = item.id === speaker.voice?.providerId;
            const inspected = item.id === inspectedProviderId;
            const locked = !item.configured;
            const markOnly = wordmarkOnly(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                aria-label={`${item.label} · ${providerStatus(item)}`}
                onClick={() => chooseProvider(item.id)}
                className={`min-h-[76px] rounded-md border p-3 text-left transition-colors ${selected ? 'border-stone-950 bg-white' : inspected ? 'border-[#b58ca0] bg-[#faf6f8]' : 'border-stone-200 bg-white hover:border-stone-400'}`}
              >
                <span className="flex items-center gap-2">
                  <ProviderMark providerId={item.id} className={markOnly ? '' : 'h-4 w-4'} />
                  {!markOnly ? <span className={`truncate text-xs font-semibold ${locked ? 'text-stone-500' : 'text-stone-900'}`}>{item.label}</span> : null}
                  {selected ? <Check className="ml-auto h-3.5 w-3.5 text-[#7d5066]" /> : locked ? <LockKeyhole className="ml-auto h-3.5 w-3.5 text-stone-400" /> : null}
                </span>
                <span className={`mt-3 block text-[10px] font-medium ${locked ? 'text-stone-400' : 'text-stone-500'}`}>{providerStatus(item)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {inspectedProviderId !== 'off' ? <Guidance catalog={catalog} provider={inspectedProvider} kind="voice" /> : null}

      {provider && model && speaker.voice ? (
        <div className="mt-6 space-y-4 border-t border-stone-200 pt-5">
          <div>
            <h3 className="text-sm font-semibold text-stone-950">Shape the voice</h3>
            <p className="mt-1 text-xs leading-5 text-stone-500">Choose the voice, delivery, and pace. Preview before continuing.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
              Voice model
              <select
                value={speaker.voice.modelId}
                onChange={(event) => {
                  const nextModel = provider.models.find((item) => item.id === event.target.value) || provider.models[0];
                  onPatch({ voice: { ...speaker.voice!, modelId: nextModel.id, voiceId: nextModel.voices[0]?.id || undefined } });
                }}
                className="mt-2 min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm font-normal text-stone-800 outline-none focus:border-stone-950"
              >
                {provider.models.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
              Voice
              <select
                aria-label={`Voice for ${speaker.name}`}
                value={speaker.voice.voiceId || ''}
                onChange={(event) => onPatch({ voice: { ...speaker.voice!, voiceId: event.target.value || undefined } })}
                className="mt-2 min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm font-normal text-stone-800 outline-none focus:border-stone-950"
              >
                {model.voices.map((voice) => <option key={voice.id || voice.label} value={voice.id}>{voice.label}</option>)}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">Delivery</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DELIVERY_OPTIONS.map((option) => {
                const selected = (speaker.voice?.instructions || '') === option.value;
                return <button key={option.label} type="button" aria-pressed={selected} onClick={() => onPatch({ voice: { ...speaker.voice!, instructions: option.value || undefined } })} className={`min-h-10 rounded-md border px-3 text-xs font-medium transition-colors ${selected ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'}`}>{option.label}</button>;
              })}
            </div>
          </fieldset>
          <label className="flex items-center gap-3 text-xs text-stone-500">
            Pace
            <input aria-label={`Speech pace for ${speaker.name}`} type="range" min="0.8" max="1.2" step="0.05" value={speaker.voice.speed} onChange={(event) => onPatch({ voice: { ...speaker.voice!, speed: Number(event.target.value) } })} className="h-1.5 min-w-0 flex-1 accent-stone-900" />
            <output className="w-10 text-right tabular-nums">{speaker.voice.speed.toFixed(2)}×</output>
          </label>
          <button
            type="button"
            onClick={() => status === 'loading' || status === 'playing' ? stop() : void preview(speaker)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 text-xs font-medium text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-950"
          >
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : status === 'playing' ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            {status === 'loading' ? 'Cancel preview' : status === 'playing' ? 'Stop preview' : status === 'error' ? 'Try preview again' : 'Preview voice'}
          </button>
          {error ? <p role="status" className="text-xs leading-5 text-[#754d60]">{error}</p> : null}
        </div>
      ) : null}
    </>
  );
}

function StepProgress({ step, speakers }: { step: number; speakers: ScriptSpeakerConfig[] }) {
  return (
    <div className="grid grid-cols-4 gap-1.5" aria-label={`Step ${step + 1} of ${STEP_COUNT}`}>
      {Array.from({ length: STEP_COUNT }, (_, index) => (
        <div key={index} className="min-w-0">
          <div className={`h-0.5 rounded-full transition-colors ${index <= step ? 'bg-[#7d5066]' : 'bg-stone-200'}`} />
          <span className={`mt-2 hidden truncate text-[9px] font-medium sm:block ${index === step ? 'text-stone-800' : 'text-stone-400'}`}>
            {index < 2 ? speakers[0]?.name : speakers[1]?.name} · {index % 2 === 0 ? 'Script' : 'Voice'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CastSetupDialog({ open, catalog, speakers, onChange, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const speakerIndex = step < 2 ? 0 : 1;
  const speaker = speakers[speakerIndex] || speakers[0];
  const isScriptStep = step % 2 === 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    contentRef.current?.scrollTo?.({ top: 0 });
    titleRef.current?.focus();
  }, [open, step]);

  if (!open || !speaker) return null;

  const patchSpeaker = (patch: Partial<ScriptSpeakerConfig>) => {
    if (speakerIndex === 1) setCopied(false);
    onChange(speakers.map((item, index) => index === speakerIndex ? { ...item, ...patch } : item));
  };

  const copyRowanToAlex = () => {
    const rowan = speakers[0];
    onChange(speakers.map((item, index) => index === 1 ? {
      ...item,
      model: rowan.model,
      voice: rowan.voice ? { ...rowan.voice } : undefined,
    } : item));
    setCopied(true);
    setStep(3);
  };

  const close = () => {
    dialogRef.current?.close?.();
    setStep(0);
    setCopied(false);
    onClose();
  };

  const next = () => {
    if (step === STEP_COUNT - 1) close();
    else setStep((current) => Math.min(STEP_COUNT - 1, current + 1));
  };

  const nextLabel = step === STEP_COUNT - 1
    ? speaker.voice ? 'Finish setup' : 'Finish without voice'
    : !isScriptStep && !speaker.voice ? 'Continue without voice' : 'Continue';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cast-dialog-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      className="cast-setup-dialog m-auto h-[min(92vh,820px)] w-[min(94vw,780px)] overflow-hidden rounded-lg border border-stone-200 bg-[#fbfaf7] p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/25 max-sm:h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:rounded-none"
    >
      <div className="flex h-full flex-col">
        <header className="shrink-0 border-b border-stone-200 bg-[#fbfaf7] px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7d5066]">Step {step + 1} of {STEP_COUNT}</p>
              <h2 ref={titleRef} tabIndex={-1} id="cast-dialog-title" className="mt-1 font-editorial text-2xl tracking-[-0.02em] outline-none sm:text-3xl">{speaker.name} · {isScriptStep ? 'Script' : 'Voice'}</h2>
              <p className="mt-2 max-w-xl text-xs leading-5 text-stone-500">
                {isScriptStep ? 'Choose who writes this persona’s turns, then select the exact model.' : 'Choose how this persona sounds, or keep the conversation as script only.'}
              </p>
            </div>
            <button type="button" onClick={close} className="minimal-icon-button -mr-2 -mt-2 shrink-0" aria-label="Close cast setup"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-5"><StepProgress step={step} speakers={speakers} /></div>
        </header>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div key={step} className="cast-setup-step">
            {step === 2 ? (
              <div className="mb-6 rounded-md border border-[#ddcbd4] bg-[#f8f3f5] p-4">
                <p className="text-sm font-semibold text-stone-950">How should Alex compare?</p>
                <p className="mt-1 text-xs leading-5 text-stone-600">Copy Rowan for a consistent baseline, or choose another provider and model to compare the writing.</p>
                <button type="button" onClick={copyRowanToAlex} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#b58ca0] bg-white px-4 text-xs font-semibold text-stone-800 transition-colors hover:border-[#7d5066]">
                  {copied ? <Check className="h-3.5 w-3.5 text-[#7d5066]" /> : <Copy className="h-3.5 w-3.5 text-[#7d5066]" />}
                  {copied ? 'Rowan’s setup copied' : 'Use Rowan’s complete setup'}
                </button>
              </div>
            ) : null}

            {copied && step === 3 ? (
              <div className="mb-5 flex items-start gap-2 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-600">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7d5066]" /> Rowan’s script and voice settings are now applied to Alex. You can finish or change Alex’s voice below.
              </div>
            ) : null}

            {isScriptStep ? <ScriptStep key={`${speaker.id}-script`} catalog={catalog} speaker={speaker} onPatch={patchSpeaker} /> : <VoiceStep key={`${speaker.id}-voice`} catalog={catalog} speaker={speaker} speakerIndex={speakerIndex} onPatch={patchSpeaker} />}
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-stone-200 bg-[#fbfaf7] px-5 py-4 sm:px-7">
          <button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="inline-flex min-h-11 items-center gap-2 px-1 text-xs font-medium text-stone-500 transition-colors hover:text-stone-950 disabled:invisible">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button type="button" onClick={next} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-stone-950 px-5 text-xs font-semibold text-white transition-colors hover:bg-stone-800">
            {nextLabel}
            {step < STEP_COUNT - 1 ? <ArrowRight className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
