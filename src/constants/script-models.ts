import type { ScriptModelOption, ScriptSpeakerConfig } from '@/types/research';

export const SCRIPT_MODEL_OPTIONS: ScriptModelOption[] = [
  { id: 'gpt-5.5', label: 'GPT-5.5' },
  { id: 'gpt-5.4', label: 'GPT-5.4' },
  { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
  { id: 'gpt-5-mini', label: 'GPT-5 mini' },
  { id: 'gpt-5-nano', label: 'GPT-5 nano' },
];

export const DEFAULT_SCRIPT_MODEL = 'gpt-5.5';

export const DEFAULT_SCRIPT_SPEAKERS: ScriptSpeakerConfig[] = [
  { id: 'speaker_1', name: 'Dr. Rowan', model: 'gpt-5.5' },
  { id: 'speaker_2', name: 'Alex', model: 'gpt-5.4-mini' },
];
