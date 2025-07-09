import { useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Utterance = {
  speaker: "Dr Ada" | "Sam";
  text: string;
  timestamp?: number;
  exchange?: number;
  isTyping?: boolean;
};

export type ConversationEvent = {
  type: 'conversation_start' | 'typing_start' | 'typing_stop' | 'message' | 'conversation_end' | 'error';
  speaker?: "Dr Ada" | "Sam";
  text?: string;
  timestamp: number;
  exchange?: number;
};

export const usePodcastPreview = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogue, setDialogue] = useState<Utterance[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const [currentTypingSpeaker, setCurrentTypingSpeaker] = useState<"Dr Ada" | "Sam" | null>(null);
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
      console.log('🎙️ Starting real-time AI conversation for paper:', paperId);
      
      // Close any existing connections
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Use proper Supabase function URL with streaming
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
        description: "Dr. Ada and Sam are having a REAL conversation!",
      });

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('✅ Real-time conversation completed');
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
            
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7).trim();
              continue;
            }
            
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: '
                const eventData = JSON.parse(jsonStr);
                
                console.log(`📡 SSE Event:`, eventData);
                
                // Handle different event types
                switch (eventData.type || (eventData.speaker ? 'message' : 'unknown')) {
                  case 'conversation_start':
                    console.log('🎬 Conversation started');
                    break;
                    
                  case 'typing_start':
                    console.log(`⌨️ ${eventData.speaker} started typing`);
                    setCurrentTypingSpeaker(eventData.speaker);
                    break;
                    
                  case 'typing_stop':
                    console.log(`⌨️ ${eventData.speaker} stopped typing`);
                    setCurrentTypingSpeaker(null);
                    break;
                    
                  case 'message':
                    if (eventData.speaker && eventData.text) {
                      console.log(`💬 ${eventData.speaker}: ${eventData.text.substring(0, 50)}...`);
                      
                      // Add message to dialogue
                      setDialogue(prev => [...prev, {
                        speaker: eventData.speaker,
                        text: eventData.text,
                        timestamp: eventData.timestamp || Date.now(),
                        exchange: eventData.exchange
                      }]);
                      
                      // Clear typing indicator
                      setCurrentTypingSpeaker(null);
                    }
                    break;
                    
                  case 'conversation_end':
                    console.log('🎬 Conversation ended');
                    setIsLive(false);
                    setCurrentTypingSpeaker(null);
                    
                    toast({
                      title: "Conversation Completed",
                      description: "The AI hosts have finished their discussion!",
                    });
                    break;
                    
                  case 'error':
                    console.error('❌ SSE Error:', eventData.message);
                    setIsLive(false);
                    setCurrentTypingSpeaker(null);
                    
                    toast({
                      title: "Conversation Error",
                      description: eventData.message || "An error occurred during the conversation",
                      variant: "destructive",
                    });
                    break;
                    
                  default:
                    // Legacy support for old format
                    if (eventData.speaker && eventData.text) {
                      setDialogue(prev => [...prev, {
                        speaker: eventData.speaker,
                        text: eventData.text,
                        timestamp: Date.now()
                      }]);
                    }
                    break;
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
        setCurrentTypingSpeaker(null);
      }

    } catch (error: any) {
      console.error('❌ Error starting real-time conversation:', error);
      
      let errorMessage = "Failed to start real-time conversation";
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Real-time Conversation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsLive(false);
      setCurrentTypingSpeaker(null);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, isLive, toast]);

  const clearPreview = useCallback(() => {
    stopConversation();
    setDialogue([]);
    setCurrentPaperId(null);
    setCurrentTypingSpeaker(null);
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
    currentTypingSpeaker,
    hasDialogue: dialogue.length > 0
  }), [generateLivePreview, stopConversation, clearPreview, isGenerating, dialogue, isLive, currentPaperId, currentTypingSpeaker]);
};