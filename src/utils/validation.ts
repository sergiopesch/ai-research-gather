// Validation utilities for the application

export const validatePaperId = (id: string | undefined): boolean => {
  return typeof id === 'string' && id.length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date <= new Date();
};

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