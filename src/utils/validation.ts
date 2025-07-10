// Validation utilities optimized for performance
export const sanitizeText = (text: string): string => text.trim().replace(/\s+/g, ' ');

export const validateApiResponse = (data: any): boolean => {
  return !!(
    data?.papers &&
    Array.isArray(data.papers) &&
    data.papers.every((paper: any) => 
      paper?.id && paper?.title && paper?.url && paper?.source && paper?.published_date
    )
  );
};