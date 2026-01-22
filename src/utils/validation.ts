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

export const validateApiResponse = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') {
    console.error('Invalid response: not an object');
    return false;
  }

  const response = data as ApiResponseData;

  // Check for error response
  if (response.error) {
    console.error('API returned error:', response.error);
    return false;
  }

  // Check papers array exists
  if (!response.papers || !Array.isArray(response.papers)) {
    console.error('Invalid response: papers is not an array');
    return false;
  }

  // Empty array is valid (no papers found)
  if (response.papers.length === 0) {
    return true;
  }

  // Validate each paper has required fields
  const isValid = response.papers.every((paper: PaperData, index: number) => {
    const hasRequired = paper?.id && paper?.title && paper?.url && paper?.source && paper?.published_date;
    if (!hasRequired) {
      console.error(`Invalid paper at index ${index}:`, {
        hasId: !!paper?.id,
        hasTitle: !!paper?.title,
        hasUrl: !!paper?.url,
        hasSource: !!paper?.source,
        hasPublishedDate: !!paper?.published_date
      });
    }
    return hasRequired;
  });

  return isValid;
};