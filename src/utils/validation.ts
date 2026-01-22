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
  error?: string;
}

// Check if a single paper has all required fields
const isValidPaper = (paper: PaperData): boolean => {
  return !!(paper?.id && paper?.title && paper?.url && paper?.source && paper?.published_date);
};

// Validate API response structure - returns error message if invalid, null if valid
export const getApiError = (data: unknown): string | null => {
  const response = data as ApiResponseData;

  // Check if API returned an error message
  if (response?.error) {
    return response.error;
  }

  // Check if papers array exists
  if (!response?.papers || !Array.isArray(response.papers)) {
    return 'Invalid response format: missing papers array';
  }

  return null;
};

// Filter and return only valid papers from response
export const getValidPapers = (data: unknown): PaperData[] => {
  const response = data as ApiResponseData;

  if (!response?.papers || !Array.isArray(response.papers)) {
    return [];
  }

  // Filter to only valid papers instead of rejecting entire response
  return response.papers.filter(isValidPaper);
};

// Legacy validation function - kept for backwards compatibility
export const validateApiResponse = (data: unknown): boolean => {
  const response = data as ApiResponseData;
  return !!(
    response?.papers &&
    Array.isArray(response.papers) &&
    response.papers.every(isValidPaper)
  );
};