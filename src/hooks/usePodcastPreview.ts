import { useState, useCallback, useRef } from 'react';
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

      // Use optimized SSE with faster streaming
      const SUPABASE_URL = "https://eapnatbiodenijfrpqcn.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcG5hdGJpb2RlbmlqZnJwcWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NjczNjEsImV4cCI6MjA2NzU0MzM2MX0.pR-zyk4aiAzsl9xwP7VU8hLuo-3r6KXod2rk0468TZU";
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generatePodcastPreview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          paper_id: paperId,
          episode,
          duration
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      setIsGenerating(false);
      setIsLive(true);

      toast({
        title: "Live Conversation Started",
        description: "Dr. Ada and Sam are having a real conversation!",
      });

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('✅ Live conversation completed');
            setIsLive(false);
            break;
          }

          // Process stream immediately for real-time effect
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process each complete line immediately
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: '
                const data = JSON.parse(jsonStr);
                
                if (data.speaker && data.text) {
                  console.log(`🗣️ INSTANT: ${data.speaker}: ${data.text}`);
                  
                  // Add dialogue immediately for real-time effect
                  setDialogue(prev => [...prev, {
                    speaker: data.speaker,
                    text: data.text,
                    timestamp: Date.now()
                  }]);
                } else if (data.message && data.message.includes('Thanks for tuning in')) {
                  console.log('📝 Conversation ending...');
                  setIsLive(false);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Stream reading error:', streamError);
        throw streamError;
      } finally {
        reader.releaseLock();
        setIsLive(false);
      }

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

  return {
    generateLivePreview,
    stopConversation,
    clearPreview,
    isGenerating,
    dialogue,
    isLive,
    currentPaperId,
    hasDialogue: dialogue.length > 0
  };
};