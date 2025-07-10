import { useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

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
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  const stopConversation = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsLive(false);
    setIsGenerating(false);
    setCurrentTypingSpeaker(null);
  }, []);

  const generateLivePreview = useCallback(async (
    paperId: string, 
    episode: number = 1, 
    duration: number = 10
  ) => {
    if (isGenerating || isLive) {
      return;
    }
    
    setIsGenerating(true);
    setDialogue([]);
    setCurrentPaperId(paperId);
    setIsLive(false);
    setError(null);
    let receivedMessage = false;
    let retryCount = 0;
    const maxRetries = 2;
    
    const attemptConnection = async (): Promise<void> => {
      try {
        const functionUrl = `${SUPABASE_URL}/functions/v1/generatePodcastPreview`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({ paper_id: paperId, episode, duration }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Server error: ${response.status}`;
          
          if (errorText.includes('OpenAI API key')) {
            errorMessage = 'OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase Edge Functions environment variables.';
          } else if (errorText.includes('Paper not found')) {
            errorMessage = 'Selected paper not found. Please select a paper first.';
          } else if (errorText.includes('SELECTED')) {
            errorMessage = 'Paper must be in SELECTED status. Please select a paper first.';
          }
          
          throw new Error(errorMessage);
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
              setIsLive(false);
              if (!receivedMessage && !error) {
                throw new Error('The conversation ended before any messages were received.');
              }
              break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              if (line.startsWith('event: ')) continue;
              
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6);
                  const eventData = JSON.parse(jsonStr);
                  
                  switch (eventData.type || (eventData.speaker ? 'message' : 'unknown')) {
                    case 'conversation_start':
                      break;
                    case 'typing_start':
                      setCurrentTypingSpeaker(eventData.speaker);
                      break;
                    case 'typing_stop':
                      setCurrentTypingSpeaker(null);
                      break;
                    case 'message':
                      receivedMessage = true;
                      setDialogue(prev => [...prev, {
                        speaker: eventData.speaker,
                        text: eventData.text,
                        timestamp: eventData.timestamp || Date.now(),
                        exchange: eventData.exchange
                      }]);
                      setCurrentTypingSpeaker(null);
                      break;
                    case 'conversation_end':
                      setIsLive(false);
                      setCurrentTypingSpeaker(null);
                      toast({
                        title: "Conversation Completed",
                        description: "The AI hosts have finished their discussion!",
                      });
                      break;
                    case 'error':
                      throw new Error(eventData.message || 'Server error occurred during conversation.');
                    default:
                      if (eventData.speaker && eventData.text) {
                        receivedMessage = true;
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
        } finally {
          reader.releaseLock();
          setIsLive(false);
          setCurrentTypingSpeaker(null);
        }
        
      } catch (connectionError: any) {
        if (retryCount < maxRetries && (
          connectionError.name === 'AbortError' ||
          connectionError.message.includes('network') ||
          connectionError.message.includes('timeout') ||
          connectionError.message.includes('502') ||
          connectionError.message.includes('503')
        )) {
          retryCount++;
          const delay = 2000 * retryCount; // Exponential backoff
          toast({
            title: "Connection Issue",
            description: `Retrying connection... (${retryCount}/${maxRetries})`,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptConnection();
        }
        throw connectionError;
      }
    };

    try {
      await attemptConnection();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to start real-time conversation';
      setError(errorMessage);
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
    setError(null);
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
    hasDialogue: dialogue.length > 0,
    error,
  }), [generateLivePreview, stopConversation, clearPreview, isGenerating, dialogue, isLive, currentPaperId, currentTypingSpeaker, error]);
};