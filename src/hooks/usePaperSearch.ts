import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getApiError, getValidPapers } from '@/utils/validation';
import type { Paper } from '@/types/research';

const API_URL = 'https://eapnatbiodenijfrpqcn.supabase.co/functions/v1/paperFinder';

export const usePaperSearch = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchPapers = useCallback(async (keywords: string[], limit: number = 6) => {
    if (loading) return; // Prevent multiple concurrent requests

    setLoading(true);
    setError(null);

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const since = yesterday.toISOString().split('T')[0];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ since, keywords, limit }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Check for API-level errors first
      const apiError = getApiError(data);
      if (apiError) {
        throw new Error(apiError);
      }

      // Get valid papers (filters out any malformed entries)
      const validPapers = getValidPapers(data) as Paper[];
      setPapers(validPapers);

      if (validPapers.length > 0) {
        toast({
          title: "Papers loaded",
          description: `Found ${validPapers.length} research papers`
        });
      } else {
        toast({
          title: "No papers found",
          description: "Try selecting different research areas or topics"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);

      // Provide specific error messages based on error type
      let toastDescription = "Please check your connection and try again";
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toastDescription = "Request timed out. The server may be busy - please try again.";
        } else if (error.message.includes('API Error')) {
          toastDescription = error.message;
        } else if (error.message.includes('Internal server error')) {
          toastDescription = "Server error occurred. Please try again in a moment.";
        }
      }

      toast({
        title: "Failed to load papers",
        description: toastDescription,
        variant: "destructive"
      });
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, [loading, toast]);

  const clearPapers = useCallback(() => {
    setPapers([]);
    setError(null);
  }, []);

  return { papers, loading, error, searchPapers, clearPapers };
};