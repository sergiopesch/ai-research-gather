import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SELECTED_PAPER_KEY = 'selectedPaper';

export const usePaperActions = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaper, setSelectedPaperState] = useState<string | null>(() => {
    // Initialize from localStorage
    try {
      return localStorage.getItem(SELECTED_PAPER_KEY);
    } catch {
      return null;
    }
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Persist selectedPaper to localStorage whenever it changes
  const setSelectedPaper = useCallback((paperId: string | null) => {
    setSelectedPaperState(paperId);
    try {
      if (paperId) {
        localStorage.setItem(SELECTED_PAPER_KEY, paperId);
      } else {
        localStorage.removeItem(SELECTED_PAPER_KEY);
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  const selectPaper = useCallback(async (paperId: string) => {
    if (isSelecting || selectedPaper === paperId) return;
    
    setIsSelecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('selectPaper', {
        body: { paper_id: paperId }
      });

      if (error) {
        // Check for 409 conflict error (paper already selected)
        const errorContext = error.context || {};
        const errorStatus = errorContext.status || error.status;
        
        if (errorStatus === 409 || error.message?.includes('already selected')) {
          setSelectedPaper(paperId);
          toast({
            title: "Paper Already Selected",
            description: "This paper is ready for processing. Redirecting...",
          });
          setTimeout(() => navigate('/processing'), 1000);
          return { success: true, already_selected: true };
        }
        throw error;
      }

      setSelectedPaper(paperId);
      toast({
        title: "Paper Selected",
        description: "Redirecting to processing hub...",
      });
      setTimeout(() => navigate('/processing'), 1000);
      return data;
    } catch (error: unknown) {
      console.error('Selection error:', error);

      // Check for 409 conflict error in multiple possible places
      const err = error as { context?: { status?: number }; status?: number; message?: string };
      const errorStatus = err?.context?.status || err?.status;
      const errorMessage = err?.message || '';
      
      if (errorStatus === 409 || errorMessage.includes('already selected') || errorMessage.includes('409')) {
        setSelectedPaper(paperId);
        toast({
          title: "Paper Already Selected", 
          description: "This paper is ready for processing. Redirecting...",
        });
        setTimeout(() => navigate('/processing'), 1000);
        return { success: true, already_selected: true };
      }

      toast({
        title: "Selection Failed",
        description: errorMessage || "Failed to select paper",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSelecting(false);
    }
  }, [isSelecting, selectedPaper, toast, setSelectedPaper, navigate]);

  const processPaper = useCallback(async (paperId: string, model?: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('processPaper', {
        body: { paper_id: paperId, model: model || 'gpt-4.1-2025-04-14' }
      });

      if (error) throw error;

      toast({
        title: "Processing Complete",
        description: "Paper summary and podcast script generated successfully",
      });

      return data;
    } catch (error: unknown) {
      console.error('Error processing paper:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process paper",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, toast]);

  const isPaperSelected = useCallback((paperId: string) => {
    return selectedPaper === paperId;
  }, [selectedPaper]);

  const clearSelectedPaper = useCallback(() => {
    setSelectedPaper(null);
  }, [setSelectedPaper]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    selectPaper,
    processPaper,
    isPaperSelected,
    clearSelectedPaper,
    isSelecting,
    isProcessing,
    selectedPaper,
    hasSelectedPaper: selectedPaper !== null
  }), [selectPaper, processPaper, isPaperSelected, clearSelectedPaper, isSelecting, isProcessing, selectedPaper]);
};