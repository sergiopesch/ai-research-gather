import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Utterance = {
  speaker: "Dr Ada" | "Sam";
  text: string;
};

export type PodcastPreviewResponse = {
  episode: number;
  paper_id: string;
  dialogue: Utterance[];
  metadata: {
    title: string;
    duration_seconds: number;
    utterance_count: number;
  };
};

export const usePodcastPreview = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<PodcastPreviewResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUtteranceIndex, setCurrentUtteranceIndex] = useState(0);
  const { toast } = useToast();

  const generatePreview = useCallback(async (
    paperId: string, 
    episode: number = 1, 
    duration: number = 10
  ) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setPreview(null);
    setCurrentUtteranceIndex(0);
    setIsPlaying(false);

    try {
      console.log('🎙️ Generating podcast preview for paper:', paperId);
      
      const { data, error } = await supabase.functions.invoke('generatePodcastPreview', {
        body: { 
          paper_id: paperId, 
          episode, 
          duration 
        }
      });

      if (error) throw error;

      console.log('✅ Podcast preview generated:', data);
      setPreview(data);
      
      toast({
        title: "Preview Generated",
        description: `Created ${data.dialogue.length} dialogue lines for The Notebook Pod`,
      });

      return data;
    } catch (error: any) {
      console.error('❌ Error generating podcast preview:', error);
      
      let errorMessage = "Failed to generate podcast preview";
      if (error?.message) {
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Preview Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, toast]);

  const playPreview = useCallback(() => {
    if (!preview || isPlaying) return;
    
    setIsPlaying(true);
    setCurrentUtteranceIndex(0);
    
    const playNextUtterance = (index: number) => {
      if (index >= preview.dialogue.length) {
        setIsPlaying(false);
        setCurrentUtteranceIndex(0);
        return;
      }
      
      setCurrentUtteranceIndex(index);
      
      // Simulate speech timing - roughly 2 seconds per utterance
      setTimeout(() => {
        playNextUtterance(index + 1);
      }, 2000);
    };
    
    playNextUtterance(0);
  }, [preview, isPlaying]);

  const stopPreview = useCallback(() => {
    setIsPlaying(false);
    setCurrentUtteranceIndex(0);
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
    setCurrentUtteranceIndex(0);
    setIsPlaying(false);
  }, []);

  return {
    generatePreview,
    playPreview,
    stopPreview,
    clearPreview,
    isGenerating,
    preview,
    isPlaying,
    currentUtteranceIndex,
    hasPreview: preview !== null
  };
};