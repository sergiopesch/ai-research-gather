export const sanitizeText = (text: string): string => text.trim().replace(/\s+/g, ' ');

interface PaperData {
  id?: string;
  title?: string;
  url?: string;
  source?: string;
  published_date?: string;
}

interface ApiResponseData {
  papers?: PaperData[];
  error?: string;
}

const isValidPaper = (paper: PaperData): boolean => {
  return !!(paper?.id && paper?.title && paper?.url && paper?.source && paper?.published_date);
};

export const getApiError = (data: unknown): string | null => {
  const response = data as ApiResponseData;

  if (response?.error) {
    return response.error;
  }

  if (!response?.papers || !Array.isArray(response.papers)) {
    return 'Invalid response format: missing papers array';
  }

  return null;
};

export const getValidPapers = (data: unknown): PaperData[] => {
  const response = data as ApiResponseData;

  if (!response?.papers || !Array.isArray(response.papers)) {
    return [];
  }

  return response.papers.filter(isValidPaper);
};
