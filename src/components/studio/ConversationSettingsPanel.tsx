import { LockKeyhole } from 'lucide-react';
import { CONVERSATION_TURN_PRESETS } from '@shared/conversation';
import type { ConversationSettings } from '@shared/research';

type Props = {
  settings: ConversationSettings;
  maxTurns: number;
  hasVoice: boolean;
  onChange: (settings: ConversationSettings) => void;
  disabled?: boolean;
};

const PRESET_DETAILS: Record<number, { label: string; duration: string }> = {
  8: { label: 'Quick', duration: '≈ 2 min' },
  12: { label: 'Balanced', duration: '≈ 3 min' },
  20: { label: 'Deep dive', duration: '≈ 5 min' },
};

export function ConversationSettingsPanel({ settings, maxTurns, hasVoice, onChange, disabled }: Props) {
  const selectedDetail = PRESET_DETAILS[settings.turnCount];
  const hasLockedDepth = maxTurns < CONVERSATION_TURN_PRESETS[CONVERSATION_TURN_PRESETS.length - 1];

  return (
    <section aria-labelledby="conversation-settings-heading" className="mt-6 border-t border-stone-200 pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="conversation-settings-heading" className="text-sm font-semibold text-stone-950">Conversation</h2>
        <span className="text-[10px] text-stone-400">{settings.turnCount} turns · {selectedDetail.duration}</span>
      </div>
      <p className="mt-2 text-[11px] leading-[1.55] text-stone-500">
        Choose the depth before generating. Both personas receive the same number of turns.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Conversation length">
        {CONVERSATION_TURN_PRESETS.map((turnCount) => {
          const detail = PRESET_DETAILS[turnCount];
          const selected = settings.turnCount === turnCount;
          const locked = turnCount > maxTurns;
          return (
            <button
              key={turnCount}
              type="button"
              role="radio"
              aria-label={`${turnCount} turns · ${detail.label}${locked ? ' · Locked' : ''}`}
              aria-checked={selected}
              disabled={disabled || locked}
              onClick={() => onChange({ turnCount })}
              className={`min-h-[68px] rounded-md border px-2 py-2.5 text-left transition-colors ${selected ? 'border-stone-950 bg-white' : 'border-stone-200 bg-white hover:border-stone-400'} disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400`}
            >
              <span className="flex items-center text-xs font-semibold">
                {turnCount}
                {locked ? <LockKeyhole className="ml-auto h-3 w-3" aria-hidden="true" /> : null}
              </span>
              <span className="mt-2 block text-[9px] font-medium text-stone-400">{detail.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] leading-4 text-stone-400">
        {hasLockedDepth
          ? 'The public studio is capped at 8 turns. Private access or a local setup unlocks 12 and 20.'
          : hasVoice
            ? `${settings.turnCount} voice clips will be generated after their script turns arrive.`
            : 'Longer conversations take more generation time and model usage.'}
      </p>
    </section>
  );
}
