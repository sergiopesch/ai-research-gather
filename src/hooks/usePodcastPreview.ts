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
    try {
      const functionUrl = `${SUPABASE_URL}/functions/v1/generatePodcastPreview`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ paper_id: paperId, episode, duration })
      });
      if (!response.ok) {
        const errorText = await response.text();
        setError(`Server error: ${response.status} - ${errorText}`);
        toast({
          title: "Live Conversation Error",
          description: `Server error: ${response.status} - ${errorText}`,
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }
      const reader = response.body?.getReader();
      if (!reader) {
        setError('No response body reader available');
        toast({
          title: "Live Conversation Error",
          description: 'No response body reader available',
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
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
              setError('The conversation ended before any messages were received.');
              toast({
                title: "Live Conversation Error",
                description: 'The conversation ended before any messages were received.',
                variant: "destructive",
              });
            }
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('event: ')) {
              continue;
            }
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
                    setError(eventData.message || 'Unknown error occurred during conversation.');
                    toast({
                      title: "Live Conversation Error",
                      description: eventData.message || 'Unknown error occurred during conversation.',
                      variant: "destructive",
                    });
                    setIsLive(false);
                    setCurrentTypingSpeaker(null);
                    break;
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
      } catch (streamError) {
        setError('Stream reading error: ' + streamError.message);
        toast({
          title: "Live Conversation Error",
          description: 'Stream reading error: ' + streamError.message,
          variant: "destructive",
        });
        setIsLive(false);
        setCurrentTypingSpeaker(null);
        throw streamError;
      } finally {
        reader.releaseLock();
        setIsLive(false);
        setCurrentTypingSpeaker(null);
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to start real-time conversation');
      toast({
        title: "Real-time Conversation Failed",
        description: error?.message || 'Failed to start real-time conversation',
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