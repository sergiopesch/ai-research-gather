import { useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Utterance = {
  speaker: "Dr Ada" | "Sam";
  text: string;
  timestamp?: number;
};

export const usePodcastPreview = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogue, setDialogue] = useState<Utterance[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  const stopConversation = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsLive(false);
    setIsGenerating(false);
    console.log('🛑 Conversation stopped');
  }, []);

  const generateLivePreview = useCallback(async (
    paperId: string, 
    episode: number = 1, 
    duration: number = 10
  ) => {
    if (isGenerating || isLive) {
      console.log('Already generating or live conversation in progress');
      return;
    }
    
    setIsGenerating(true);
    setDialogue([]);
    setCurrentPaperId(paperId);
    setIsLive(false);

    try {
      console.log('🎙️ Starting live podcast conversation for paper:', paperId);
      
      // Close any existing connections
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Use proper Supabase client function invocation
      const { data, error } = await supabase.functions.invoke('generatePodcastPreview', {
        body: {
          paper_id: paperId,
          episode,
          duration
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      // If the function returns immediate data, handle it
      if (data && data.dialogue) {
        setIsLive(true);
        setIsGenerating(false);
        
        toast({
          title: "Live Conversation Started",
          description: "Dr. Ada and Sam are having a real conversation!",
        });

        // Simulate real-time streaming of the dialogue
        for (let i = 0; i < data.dialogue.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between messages
          
          setDialogue(prev => [...prev, {
            speaker: data.dialogue[i].speaker,
            text: data.dialogue[i].text,
            timestamp: Date.now()
          }]);
        }
        
        setIsLive(false);
        return;
      }

      throw new Error('No valid response from function');

    } catch (error: any) {
      console.error('❌ Error starting live preview:', error);
      
      let errorMessage = "Failed to start live conversation";
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Live Conversation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsLive(false);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, isLive, toast]);

  const clearPreview = useCallback(() => {
    stopConversation();
    setDialogue([]);
    setCurrentPaperId(null);
    console.log('🧹 Cleared conversation');
  }, [stopConversation]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    generateLivePreview,
    stopConversation,
    clearPreview,
    isGenerating,
    dialogue,
    isLive,
    currentPaperId,
    hasDialogue: dialogue.length > 0
  }), [generateLivePreview, stopConversation, clearPreview, isGenerating, dialogue, isLive, currentPaperId]);
};