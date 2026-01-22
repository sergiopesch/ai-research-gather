// Validation utilities optimized for performance
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
}

export const validateApiResponse = (data: unknown): boolean => {
  const response = data as ApiResponseData;
  return !!(
    response?.papers &&
    Array.isArray(response.papers) &&
    response.papers.every((paper: PaperData) =>
      paper?.id && paper?.title && paper?.url && paper?.source && paper?.published_date
    )
  );
};