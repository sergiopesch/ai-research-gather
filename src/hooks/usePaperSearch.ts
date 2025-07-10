import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateApiResponse } from '@/utils/validation';
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
      
      if (!validateApiResponse(data)) {
        throw new Error('Invalid response format from server');
      }

      setPapers(data.papers);
      
      toast({
        title: "Papers loaded",
        description: `Found ${data.papers.length} research papers`
      });
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      
      toast({
        title: "Failed to load papers",
        description: error instanceof Error && error.name === 'AbortError' 
          ? "Request timed out. Please try again." 
          : "Please check your connection and try again",
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