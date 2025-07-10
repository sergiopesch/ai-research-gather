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

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error' | 'retrying';

// Enhanced debugging utilities
const DEBUG_MODE = true; // Simplified for compatibility

const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`🎙️ [PodcastPreview] ${message}`, data || '');
  }
};

const debugError = (message: string, error?: any) => {
  console.error(`❌ [PodcastPreview] ${message}`, error || '');
};

const debugWarn = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.warn(`⚠️ [PodcastPreview] ${message}`, data || '');
  }
};

export const usePodcastPreviewEnhanced = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogue, setDialogue] = useState<Utterance[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const [currentTypingSpeaker, setCurrentTypingSpeaker] = useState<"Dr Ada" | "Sam" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const heartbeatTimeoutRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  // Enhanced cleanup function
  const cleanup = useCallback(() => {
    debugLog('Cleaning up resources...');
    
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
        readerRef.current.releaseLock();
      } catch (e) {
        debugWarn('Error during reader cleanup', e);
      }
      readerRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    
    setIsLive(false);
    setIsGenerating(false);
    setCurrentTypingSpeaker(null);
    setConnectionState('idle');
    setLastHeartbeat(null);
  }, []);

  const stopConversation = useCallback(() => {
    debugLog('Stopping conversation...');
    cleanup();
    toast({
      title: "Conversation Stopped",
      description: "The live conversation has been stopped.",
    });
  }, [cleanup, toast]);

  // Enhanced error handler with specific error types
  const handleError = useCallback((error: any, context: string = 'Unknown') => {
    debugError(`Error in ${context}:`, error);
    
    let errorMessage = 'Unknown error occurred';
    let isRetryable = false;
    
    if (error?.message) {
      errorMessage = error.message;
      
      // Determine if error is retryable
      if (error.message.includes('network') || 
          error.message.includes('timeout') || 
          error.message.includes('connection') ||
          error.message.includes('503') ||
          error.message.includes('502')) {
        isRetryable = true;
      }
    }
    
    // Check for specific error patterns
    if (errorMessage.includes('OpenAI API key')) {
      errorMessage = 'OpenAI API key not configured in Supabase. Please add OPENAI_API_KEY to Edge Functions environment variables.';
      isRetryable = false;
    } else if (errorMessage.includes('Paper not found')) {
      errorMessage = 'Selected paper not found. Please select a paper first.';
      isRetryable = false;
    } else if (errorMessage.includes('SELECTED')) {
      errorMessage = 'Paper must be in SELECTED status. Please select a paper first.';
      isRetryable = false;
    }
    
    setError(errorMessage);
    setConnectionState('error');
    
    return { errorMessage, isRetryable };
  }, []);

  // Enhanced retry logic with exponential backoff
  const scheduleRetry = useCallback((retryFunction: () => Promise<void>, attempt: number) => {
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds
    const maxDelay = 30000; // 30 seconds
    
    if (attempt >= maxRetries) {
      debugError('Max retries exceeded');
      setConnectionState('error');
      toast({
        title: "Connection Failed",
        description: "Unable to establish connection after multiple attempts.",
        variant: "destructive",
      });
      return;
    }
    
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    debugLog(`Scheduling retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
    
    setConnectionState('retrying');
    setRetryAttempt(attempt + 1);
    
    retryTimeoutRef.current = setTimeout(async () => {
      try {
        await retryFunction();
      } catch (error) {
        debugError('Retry failed:', error);
        scheduleRetry(retryFunction, attempt + 1);
      }
    }, delay);
  }, [toast]);

  // Enhanced heartbeat monitoring
  const startHeartbeatMonitoring = useCallback(() => {
    const heartbeatInterval = 30000; // 30 seconds
    
    const checkHeartbeat = () => {
      if (lastHeartbeat && isLive) {
        const timeSinceLastHeartbeat = Date.now() - lastHeartbeat.getTime();
        if (timeSinceLastHeartbeat > heartbeatInterval * 2) {
          debugWarn('Heartbeat timeout detected');
          handleError(new Error('Connection timeout'), 'Heartbeat');
        }
      }
    };
    
    heartbeatTimeoutRef.current = setTimeout(checkHeartbeat, heartbeatInterval);
  }, [lastHeartbeat, isLive, handleError]);

  // Enhanced paper validation
  const validatePaper = useCallback(async (paperId: string) => {
    debugLog('Validating paper...', paperId);
    
    try {
      const { data: paper, error } = await supabase
        .from('papers')
        .select('id, title, status')
        .eq('id', paperId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!paper) {
        throw new Error('Paper not found in database');
      }

      if (paper.status !== 'SELECTED') {
        throw new Error(`Paper status is ${paper.status}, expected SELECTED`);
      }

      debugLog('Paper validation successful', paper);
      return paper;
    } catch (error) {
      debugError('Paper validation failed:', error);
      throw error;
    }
  }, []);

  // Enhanced SSE connection with comprehensive error handling
  const establishSSEConnection = useCallback(async (paperId: string, episode: number, duration: number) => {
    debugLog('Establishing SSE connection...', { paperId, episode, duration });
    setConnectionState('connecting');
    
    const functionUrl = `${SUPABASE_URL}/functions/v1/generatePodcastPreview`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
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
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      debugLog('SSE connection established successfully');
      setConnectionState('connected');
      setError(null);
      setRetryAttempt(0);
      
      return response.body.getReader();
    } catch (error) {
      clearTimeout(timeoutId);
      debugError('Failed to establish SSE connection:', error);
      throw error;
    }
  }, []);

  // Enhanced stream processing with better error handling
  const processSSEStream = useCallback(async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    let buffer = '';
    let receivedMessage = false;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          debugLog('SSE stream completed');
          if (!receivedMessage && !error) {
            throw new Error('Stream ended without receiving any messages');
          }
          break;
        }

        // Update heartbeat
        setLastHeartbeat(new Date());
        
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
              
              debugLog('Received SSE event:', eventData);
              
              await processSSEEvent(eventData);
              receivedMessage = true;
              
            } catch (parseError) {
              debugWarn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (streamError) {
      debugError('Stream processing error:', streamError);
      throw streamError;
    } finally {
      try {
        reader.releaseLock();
      } catch (e) {
        debugWarn('Error releasing reader lock:', e);
      }
    }
  }, [error]);

  // Enhanced event processing
  const processSSEEvent = useCallback(async (eventData: any) => {
    switch (eventData.type || (eventData.speaker ? 'message' : 'unknown')) {
      case 'conversation_start':
        debugLog('Conversation started');
        setIsLive(true);
        break;
        
      case 'typing_start':
        debugLog(`${eventData.speaker} started typing`);
        setCurrentTypingSpeaker(eventData.speaker);
        break;
        
      case 'typing_stop':
        debugLog(`${eventData.speaker} stopped typing`);
        setCurrentTypingSpeaker(null);
        break;
        
      case 'message':
        debugLog('New message received', eventData);
        setDialogue(prev => [...prev, {
          speaker: eventData.speaker,
          text: eventData.text,
          timestamp: eventData.timestamp || Date.now(),
          exchange: eventData.exchange
        }]);
        setCurrentTypingSpeaker(null);
        break;
        
      case 'conversation_end':
        debugLog('Conversation ended');
        setIsLive(false);
        setCurrentTypingSpeaker(null);
        toast({
          title: "Conversation Completed",
          description: "The AI hosts have finished their discussion!",
        });
        break;
        
      case 'error':
        debugError('SSE error event:', eventData);
        throw new Error(eventData.message || 'Server error occurred');
        
      default:
        if (eventData.speaker && eventData.text) {
          debugLog('Fallback message processing', eventData);
          setDialogue(prev => [...prev, {
            speaker: eventData.speaker,
            text: eventData.text,
            timestamp: Date.now()
          }]);
        } else {
          debugWarn('Unknown SSE event type:', eventData);
        }
        break;
    }
  }, [toast]);

  // Main function with comprehensive error handling and retry logic
  const generateLivePreview = useCallback(async (
    paperId: string, 
    episode: number = 1, 
    duration: number = 10
  ) => {
    if (isGenerating || isLive) {
      debugWarn('Generation already in progress');
      return;
    }
    
    debugLog('Starting live preview generation...', { paperId, episode, duration });
    
    setIsGenerating(true);
    setDialogue([]);
    setCurrentPaperId(paperId);
    setIsLive(false);
    setError(null);
    setConnectionState('connecting');
    setRetryAttempt(0);

    const attemptGeneration = async () => {
      try {
        // Step 1: Validate paper
        await validatePaper(paperId);
        
        // Step 2: Establish SSE connection
        const reader = await establishSSEConnection(paperId, episode, duration);
        readerRef.current = reader;
        
        setIsGenerating(false);
        setIsLive(true);
        
        toast({
          title: "Live Conversation Started",
          description: "Dr. Ada and Sam are having a REAL conversation!",
        });
        
        // Step 3: Start heartbeat monitoring
        startHeartbeatMonitoring();
        
        // Step 4: Process stream
        await processSSEStream(reader);
        
      } catch (error: any) {
        debugError('Generation attempt failed:', error);
        
        const { errorMessage, isRetryable } = handleError(error, 'generateLivePreview');
        
        toast({
          title: "Live Conversation Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        if (isRetryable && retryAttempt < 3) {
          scheduleRetry(attemptGeneration, retryAttempt);
        } else {
          cleanup();
        }
        
        throw error;
      }
    };

    try {
      await attemptGeneration();
    } catch (finalError) {
      debugError('Final generation error:', finalError);
      // Error already handled in attemptGeneration
    }
  }, [
    isGenerating, 
    isLive, 
    retryAttempt, 
    validatePaper, 
    establishSSEConnection, 
    processSSEStream, 
    handleError, 
    scheduleRetry, 
    cleanup, 
    toast,
    startHeartbeatMonitoring
  ]);

  const clearPreview = useCallback(() => {
    debugLog('Clearing preview...');
    cleanup();
    setDialogue([]);
    setCurrentPaperId(null);
    setCurrentTypingSpeaker(null);
    setError(null);
    setRetryAttempt(0);
  }, [cleanup]);

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
    connectionState,
    retryAttempt,
    lastHeartbeat,
    // Debug utilities
    debugInfo: DEBUG_MODE ? {
      connectionState,
      retryAttempt,
      lastHeartbeat,
      hasReader: !!readerRef.current,
      dialogueCount: dialogue.length
    } : undefined
  }), [
    generateLivePreview, 
    stopConversation, 
    clearPreview, 
    isGenerating, 
    dialogue, 
    isLive, 
    currentPaperId, 
    currentTypingSpeaker, 
    error,
    connectionState,
    retryAttempt,
    lastHeartbeat
  ]);
};