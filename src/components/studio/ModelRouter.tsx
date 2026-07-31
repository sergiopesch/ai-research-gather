import { useState } from 'react';
import { ArrowRight, Check, ExternalLink, Settings2, Volume2, VolumeX } from 'lucide-react';
import { CastSetupDialog } from '@/components/studio/CastSetupDialog';
import { ProviderMark } from '@/components/studio/ProviderMark';
import { splitModelRoute } from '@/lib/model-route';
import type { ModelCatalog, ScriptSpeakerConfig } from '@shared/research';

type Props = {
  catalog: ModelCatalog;
  speakers: ScriptSpeakerConfig[];
  onChange: (speakers: ScriptSpeakerConfig[]) => void;
  disabled?: boolean;
};

function modeCopy(catalog: ModelCatalog): { title: string; detail: string } {
  if (catalog.mode === 'owner-cloud') return { title: 'Private studio', detail: 'Server models and voices are available only to you.' };
  if (catalog.mode === 'local-subscription') return { title: 'Local studio', detail: 'Your authenticated plans and local provider keys are available.' };
  if (catalog.mode === 'hosted-free') return { title: 'Public studio', detail: 'Free script models are ready. Locked providers include setup guidance.' };
  if (catalog.mode === 'self-hosted') return { title: 'Local studio', detail: 'Available routes reflect the keys on this machine.' };
  return { title: 'Sample studio', detail: 'The grounded sample works without a provider key.' };
}

function SpeakerRoute({ speaker, catalog }: { speaker: ScriptSpeakerConfig; catalog: ModelCatalog }) {
  const route = splitModelRoute(speaker.model);
  const provider = catalog.scriptProviders.find((item) => item.id === route.providerId);
  const model = provider?.models.find((item) => item.id === route.modelId);
  const voiceProvider = catalog.speechProviders.find((item) => item.id === speaker.voice?.providerId);
  const markId = provider?.id || 'demo';
  const markClassName = ['xai', 'grok', 'lmnt', 'inclusionai', 'poolside'].includes(markId) ? '' : 'h-3.5 w-3.5';

  return (
    <div className="rounded-md border border-stone-200 bg-white px-3.5 py-3">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f3edf0] text-[11px] font-semibold text-[#7d5066]">{speaker.name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-stone-950">{speaker.name}</p>
          <p className="mt-0.5 truncate text-[10px] text-stone-400">{model?.label || provider?.label || 'Choose model'}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-stone-400">
          <ProviderMark providerId={markId} className={markClassName} />
          {voiceProvider ? <Volume2 className="h-3.5 w-3.5" aria-label={`${voiceProvider.label} voice`} /> : <VolumeX className="h-3.5 w-3.5" aria-label="Voice off" />}
        </div>
      </div>
    </div>
  );
}

export function ModelRouter({ catalog, speakers, onChange, disabled }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const copy = modeCopy(catalog);
  const sameModel = Boolean(speakers[0]?.model && speakers[0]?.model === speakers[1]?.model);
  const sameVoice = JSON.stringify(speakers[0]?.voice || null) === JSON.stringify(speakers[1]?.voice || null);

  return (
    <section aria-labelledby="setup-heading" className="mt-7 border-t border-stone-200 pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="setup-heading" className="text-sm font-semibold text-stone-950">Cast setup</h2>
        <span className="flex items-center gap-1 text-[10px] text-stone-400"><Check className="h-3 w-3" /> Ready</span>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7d5066]">{copy.title}</p>
        <p className="mt-1 text-[11px] leading-[1.55] text-stone-500">{copy.detail}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {speakers.map((speaker) => <SpeakerRoute key={speaker.id} speaker={speaker} catalog={catalog} />)}
      </div>

      <p className="mt-3 text-[11px] leading-4 text-stone-500">
        {sameModel && sameVoice ? 'Both personas share one setup. Change Alex to compare providers, models, or voices.' : 'The personas use different routes, ready for a side-by-side comparison.'}
      </p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-800 transition-colors hover:border-stone-500 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Settings2 className="h-4 w-4" aria-hidden="true" /> Configure cast <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <a href={catalog.repositoryUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-[11px] font-medium text-stone-500 transition-colors hover:text-[#7d5066]">
        Use your own models locally <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>

      <CastSetupDialog open={isOpen} catalog={catalog} speakers={speakers} onChange={onChange} onClose={() => setIsOpen(false)} />
    </section>
  );
}
