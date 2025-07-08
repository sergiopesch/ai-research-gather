export interface Paper {
  title: string;
  url: string;
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
  icon: any;
  keywords: string[];
  color: string;
  gradient: string;
}

export interface ApiResponse {
  papers: Paper[];
}