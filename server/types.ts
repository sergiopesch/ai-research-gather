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

export type ScriptSpeakerId = "speaker_1" | "speaker_2";

export type ScriptModel = "gpt-5.5" | "gpt-5.4" | "gpt-5.4-mini" | "gpt-5-mini" | "gpt-5-nano";

export type ScriptSpeakerConfig = {
  id: ScriptSpeakerId;
  name: string;
  model: ScriptModel;
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
  model: ScriptModel;
  speakers: ScriptSpeakerConfig[];
  segments: ScriptSegment[];
  totalDuration: string;
  createdAt: string;
};
