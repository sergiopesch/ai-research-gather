export type Paper = {
  id: string;
  title: string;
  url: string;
  pdf_url?: string;
  doi?: string;
  source: string;
  published_date: string;
  authors?: string[];
  summary?: string;
  importance?: string;
};

export type ScriptSpeakerId = 'speaker_1' | 'speaker_2';
type ScriptModel = string;

export type ConversationSettings = {
  turnCount: number;
};

export type SpeechConfig = {
  providerId: string;
  modelId: string;
  voiceId?: string;
  speed: number;
  instructions?: string;
};

export type ScriptSpeakerConfig = {
  id: ScriptSpeakerId;
  name: string;
  model: ScriptModel;
  voice?: SpeechConfig;
};

export type ScriptSegment = {
  speaker: string;
  speakerId: ScriptSpeakerId;
  speakerModel: ScriptModel;
  text: string;
  duration?: number;
};

export type PodcastScript = {
  id: string;
  title: string;
  settings: ConversationSettings;
  speakers: ScriptSpeakerConfig[];
  segments: ScriptSegment[];
  totalDuration: string;
  createdAt: string;
  generationMode?: 'ai' | 'demo' | 'fallback';
  generationNotice?: string;
};

type ModelOption = {
  id: string;
  label: string;
  description?: string;
};

export type SpeechModelOption = ModelOption & {
  voices: ModelOption[];
};

export type ProviderOption<TModel extends ModelOption = ModelOption> = {
  id: string;
  label: string;
  models: TModel[];
  configured: boolean;
  configurationKey?: string;
  setupHint?: string;
  availability?: 'free' | 'local-key' | 'subscription' | 'demo';
};

export type ModelCatalog = {
  mode: 'hosted-free' | 'owner-cloud' | 'local-subscription' | 'self-hosted' | 'demo';
  repositoryUrl: string;
  access: {
    authenticated: boolean;
    ownerAuthConfigured: boolean;
    publicAiEnabled: boolean;
    publicDailyScriptLimit: number;
    maxConversationTurns: number;
  };
  scriptProviders: ProviderOption[];
  speechProviders: ProviderOption<SpeechModelOption>[];
};
