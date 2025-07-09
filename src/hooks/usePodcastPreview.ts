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

      // Create WebSocket connection for real-time conversation
      const wsUrl = `wss://eapnatbiodenijfrpqcn.functions.supabase.co/functions/v1/realtimePodcastChat`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected, starting conversation...');
        setIsGenerating(false);
        setIsLive(true);
        
        toast({
          title: "Live Conversation Started",
          description: "Dr. Ada and Sam are having a real conversation!",
        });

        // Start the conversation
        ws.send(JSON.stringify({
          type: 'start_conversation',
          paper_id: paperId,
          episode,
          duration
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 Received WebSocket message:', data);
          
          if (data.type === 'dialogue' && data.speaker && data.text) {
            console.log(`🗣️ ${data.speaker}: ${data.text}`);
            
            setDialogue(prev => [...prev, {
              speaker: data.speaker,
              text: data.text,
              timestamp: Date.now()
            }]);
          } else if (data.type === 'end') {
            console.log('✅ Live conversation completed');
            setIsLive(false);
            ws.close();
          } else if (data.type === 'error') {
            console.error('❌ WebSocket error:', data.message);
            toast({
              title: "Live Conversation Error",
              description: data.message,
              variant: "destructive",
            });
            setIsLive(false);
            ws.close();
          }
        } catch (parseError) {
          console.warn('Failed to parse WebSocket message:', parseError);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to establish live conversation",
          variant: "destructive",
        });
        setIsLive(false);
        setIsGenerating(false);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setIsLive(false);
        if (isGenerating) {
          setIsGenerating(false);
        }
      };

      // Store WebSocket reference for cleanup
      eventSourceRef.current = ws as any;

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
      if (!isLive) {
        setIsGenerating(false);
      }
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