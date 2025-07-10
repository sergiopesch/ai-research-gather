import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type Episode = {
  id: string;
  episode_number: number;
  title: string;
  paper_id: string;
  paper_title: string;
  script: any;
  status: string;
  created_at: string;
  updated_at: string;
};

export const useEpisodes = () => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEpisodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .order('episode_number', { ascending: false });

      if (error) throw error;
      setEpisodes(data || []);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch episodes';
      setError(errorMessage);
      toast({
        title: "Failed to Load Episodes",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createEpisode = useCallback(async (paperId: string, paperTitle: string, script: any) => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .insert({
          episode_number: await getNextEpisodeNumber(),
          title: `Episode ${await getNextEpisodeNumber()}: ${paperTitle}`,
          paper_id: paperId,
          paper_title: paperTitle,
          script: script,
          status: 'GENERATED'
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchEpisodes(); // Refresh episodes list
      
      toast({
        title: "Episode Created",
        description: `Episode ${data.episode_number} has been saved to your studio`,
      });
      
      return data;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create episode';
      toast({
        title: "Failed to Create Episode",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchEpisodes, toast]);

  const getNextEpisodeNumber = async (): Promise<number> => {
    const { data } = await supabase.rpc('get_next_episode_number');
    return data || 1;
  };

  const deleteEpisode = useCallback(async (episodeId: string) => {
    try {
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', episodeId);

      if (error) throw error;
      
      await fetchEpisodes(); // Refresh episodes list
      
      toast({
        title: "Episode Deleted",
        description: "Episode has been removed from your studio",
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete episode';
      toast({
        title: "Failed to Delete Episode",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [fetchEpisodes, toast]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  return {
    episodes,
    isLoading,
    error,
    fetchEpisodes,
    createEpisode,
    deleteEpisode,
    getNextEpisodeNumber,
  };
};