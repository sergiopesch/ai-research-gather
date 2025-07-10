// Validation utilities for the application

export const sanitizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};

export const validateApiResponse = (data: any): boolean => {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.papers) &&
    data.papers.every((paper: any) => 
      paper.id && 
      paper.title && 
      paper.url &&
      paper.source &&
      paper.published_date
    )
  );
};