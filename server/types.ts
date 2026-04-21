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

export type ScriptSpeaker = "DR ROWAN" | "ALEX";

export type ScriptSegment = {
  speaker: ScriptSpeaker;
  text: string;
  duration?: number;
};

export type PodcastScript = {
  id: string;
  title: string;
  segments: ScriptSegment[];
  totalDuration: string;
  createdAt: string;
};
