import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  // Persist selectedPaper to localStorage whenever it changes
  const setSelectedPaper = useCallback((paperId: string | null) => {
    setSelectedPaperState(paperId);
    try {
      if (paperId) {
        localStorage.setItem(SELECTED_PAPER_KEY, paperId);
        console.log('💾 MOBILE DEBUG: Saved paper to localStorage:', paperId);
      } else {
        localStorage.removeItem(SELECTED_PAPER_KEY);
        console.log('🗑️ MOBILE DEBUG: Removed paper from localStorage');
      }
    } catch (error) {
      console.error('❌ MOBILE DEBUG: Failed to save to localStorage:', error);
    }
  }, []);

  const selectPaper = useCallback(async (paperId: string) => {
    if (isSelecting || selectedPaper === paperId) {
      return;
    }
    
    setIsSelecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('selectPaper', {
        body: { paper_id: paperId }
      });

      if (error) throw error;

      setSelectedPaper(paperId);
      
      toast({
        title: "Paper Selected",
        description: "Paper has been queued for processing",
      });

      return data;
    } catch (error: any) {
      let errorMessage = "Failed to select paper";
      if (error?.message) {
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Selection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSelecting(false);
    }
  }, [isSelecting, selectedPaper, toast, setSelectedPaper]);

  const processPaper = useCallback(async (paperId: string, model?: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('processPaper', {
        body: { paper_id: paperId, model: model || 'gpt-4o' }
      });

      if (error) throw error;

      toast({
        title: "Processing Complete",
        description: "Paper summary and podcast script generated successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error processing paper:', error);
      
      // Handle specific error cases with better messaging
      let errorMessage = "Failed to process paper";
      if (error?.message) {
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
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