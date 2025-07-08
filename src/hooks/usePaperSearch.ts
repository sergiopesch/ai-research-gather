import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Paper } from '@/types/research';

const API_URL = 'https://eapnatbiodenijfrpqcn.supabase.co/functions/v1/paperFinder';

export const usePaperSearch = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchPapers = async (keywords: string[], limit: number = 6) => {
    setLoading(true);
    
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const since = yesterday.toISOString().split('T')[0];

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ since, keywords, limit })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setPapers(data.papers);
      
      toast({
        title: "Papers fetched successfully",
        description: `Found ${data.papers.length} papers with summaries`
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Failed to fetch papers",
        description: error instanceof Error ? error.message : "Please check your connection and try again",
        variant: "destructive"
      });
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  return { papers, loading, searchPapers };
};