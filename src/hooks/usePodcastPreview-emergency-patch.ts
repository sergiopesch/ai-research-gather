// EMERGENCY PATCH for usePodcastPreview
// Apply this patch if live conversation fails

import { useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

// Emergency logging
const log = (message: string, data?: any) => {
  console.log(`🚨 [Emergency] ${message}`, data || '');
};

export const usePodcastPreviewEmergencyPatch = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogue, setDialogue] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const [currentTypingSpeaker, setCurrentTypingSpeaker] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    log('Emergency cleanup');
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
        readerRef.current.releaseLock();
      } catch (e) {
        log('Cleanup error', e);
      }
      readerRef.current = null;
    }
    setIsLive(false);
    setIsGenerating(false);
    setCurrentTypingSpeaker(null);
  }, []);

  const stopConversation = useCallback(() => {
    log('Emergency stop conversation');
    cleanup();
    toast({
      title: "Conversation Stopped",
      description: "Emergency stop activated",
    });
  }, [cleanup, toast]);

  const generateLivePreview = useCallback(async (paperId: string) => {
    log('Emergency live preview generation', { paperId });
    
    if (isGenerating || isLive) {
      log('Already generating, skipping');
      return;
    }
    
    setIsGenerating(true);
    setDialogue([]);
    setCurrentPaperId(paperId);
    setError(null);
    
    try {
      // Validate paper first
      log('Validating paper...');
      const { data: paper, error: paperError } = await supabase
        .from('papers')
        .select('id, title, status')
        .eq('id', paperId)
        .single();
      
      if (paperError || !paper) {
        throw new Error('Paper not found. Please select a paper first.');
      }
      
      if (paper.status !== 'SELECTED') {
        throw new Error(`Paper status is ${paper.status}, expected SELECTED. Please select the paper first.`);
      }
      
      log('Paper validated', paper);
      
      // Try to establish connection
      const functionUrl = `${SUPABASE_URL}/functions/v1/generatePodcastPreview`;
      log('Connecting to', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ paper_id: paperId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        log('Connection failed', { status: response.status, error: errorText });
        
        // Specific error handling
        if (errorText.includes('OpenAI API key')) {
          throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase Edge Functions environment variables.');
        } else if (response.status === 404) {
          throw new Error('Edge Function not found. Please check Supabase configuration.');
        } else {
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
      }
      
      if (!response.body) {
        throw new Error('No response body received');
      }
      
      log('Connection established, starting stream...');
      
      const reader = response.body.getReader();
      readerRef.current = reader;
      
      setIsGenerating(false);
      setIsLive(true);
      
      toast({
        title: "Live Conversation Started",
        description: "Emergency mode: Basic conversation active",
      });
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            log('Stream completed');
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim() === '' || !line.startsWith('data: ')) continue;
            
            try {
              const jsonStr = line.slice(6);
              const eventData = JSON.parse(jsonStr);
              
              log('SSE Event', eventData);
              
              if (eventData.type === 'typing_start') {
                setCurrentTypingSpeaker(eventData.speaker);
              } else if (eventData.type === 'typing_stop') {
                setCurrentTypingSpeaker(null);
              } else if (eventData.type === 'message' || eventData.speaker) {
                setDialogue(prev => [...prev, {
                  speaker: eventData.speaker,
                  text: eventData.text,
                  timestamp: eventData.timestamp || Date.now(),
                  exchange: eventData.exchange
                }]);
                setCurrentTypingSpeaker(null);
              } else if (eventData.type === 'conversation_end') {
                setIsLive(false);
                toast({
                  title: "Conversation Completed",
                  description: "Emergency mode conversation finished successfully!",
                });
              } else if (eventData.type === 'error') {
                throw new Error(eventData.message || 'Server error occurred');
              }
            } catch (parseError) {
              log('Parse error', parseError);
            }
          }
        }
      } finally {
        try {
          reader.releaseLock();
        } catch (e) {
          log('Reader cleanup error', e);
        }
        setIsLive(false);
        setCurrentTypingSpeaker(null);
      }
      
    } catch (error: any) {
      log('Emergency error', error);
      setError(error.message);
      
      toast({
        title: "Emergency Mode: Conversation Failed",
        description: error.message,
        variant: "destructive",
      });
      
      cleanup();
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, isLive, toast, cleanup]);

  const clearPreview = useCallback(() => {
    log('Emergency clear preview');
    cleanup();
    setDialogue([]);
    setCurrentPaperId(null);
    setError(null);
  }, [cleanup]);

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
