export interface Paper {
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
}

export interface ResearchArea {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

export type ScriptModel = "gpt-5.5" | "gpt-5.4" | "gpt-5.4-mini" | "gpt-5-mini" | "gpt-5-nano";

export interface ScriptModelOption {
  id: ScriptModel;
  label: string;
}

export type ScriptSpeakerId = "speaker_1" | "speaker_2";

export interface ScriptSpeakerConfig {
  id: ScriptSpeakerId;
  name: string;
  model: ScriptModel;
}
