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
    if (isSelecting || selectedPaper === paperId) {
      return;
    }
    
    setIsSelecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('selectPaper', {
        body: { paper_id: paperId }
      });

      if (error) {
        // Handle specific error cases
        if (error.message && error.message.includes('409')) {
          // Paper already selected - this is actually good news!
          setSelectedPaper(paperId);
          
          toast({
            title: "Paper Already Selected",
            description: "This paper is ready for processing. Redirecting...",
          });

          // Automatically redirect to processing hub
          setTimeout(() => {
            navigate('/processing');
          }, 1000);

          return { success: true, already_selected: true };
        }
        throw error;
      }

      setSelectedPaper(paperId);
      
      toast({
        title: "Paper Selected",
        description: "Redirecting to processing hub...",
      });

      // Automatically redirect to processing hub
      setTimeout(() => {
        navigate('/processing');
      }, 1000);

      return data;
    } catch (error: any) {
      console.error('Selection error:', error);
      
      // Enhanced error parsing for better user experience
      let errorMessage = "Failed to select paper";
      let errorTitle = "Selection Failed";
      
      if (error?.message) {
        try {
          // Try to parse JSON error response
          const errorData = JSON.parse(error.message);
          
          if (errorData.error === "Paper already selected") {
            // Handle already selected case gracefully
            setSelectedPaper(paperId);
            
            toast({
              title: "Paper Ready",
              description: "This paper is already selected and ready for processing!",
            });

            // Redirect to processing hub
            setTimeout(() => {
              navigate('/processing');
            }, 1000);

            return { success: true, already_selected: true };
          }
          
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorTitle = errorData.error || errorTitle;
        } catch {
          // If not JSON, check for specific error patterns
          if (error.message.includes('409') || error.message.includes('already selected')) {
            setSelectedPaper(paperId);
            
            toast({
              title: "Paper Ready",
              description: "This paper is already selected and ready for processing!",
            });

            setTimeout(() => {
              navigate('/processing');
            }, 1000);

            return { success: true, already_selected: true };
          }
          
          errorMessage = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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