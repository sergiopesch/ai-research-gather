import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { Paper } from '@/types/research';

const SELECTED_PAPER_KEY = 'selectedPaper';

export const usePaperActions = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedPaper, setSelectedPaperState] = useState<Paper | null>(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem(SELECTED_PAPER_KEY);
      return stored ? JSON.parse(stored) as Paper : null;
    } catch {
      return null;
    }
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Persist selectedPaper to localStorage whenever it changes
  const setSelectedPaper = useCallback((paper: Paper | null) => {
    setSelectedPaperState(paper);
    try {
      if (paper) {
        localStorage.setItem(SELECTED_PAPER_KEY, JSON.stringify(paper));
      } else {
        localStorage.removeItem(SELECTED_PAPER_KEY);
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  const selectPaper = useCallback(async (paper: Paper) => {
    if (isSelecting || selectedPaper?.id === paper.id) return;
    
    setIsSelecting(true);
    try {
      setSelectedPaper(paper);
      toast({
        title: "Paper Selected",
        description: "Redirecting to processing hub...",
      });
      setTimeout(() => navigate('/processing'), 1000);
      return { success: true };
    } catch (error: unknown) {
      console.error('Selection error:', error);

      toast({
        title: "Selection Failed",
        description: error instanceof Error ? error.message : "Failed to select paper",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSelecting(false);
    }
  }, [isSelecting, selectedPaper, toast, setSelectedPaper, navigate]);

  const isPaperSelected = useCallback((paperId: string) => {
    return selectedPaper?.id === paperId;
  }, [selectedPaper]);

  const clearSelectedPaper = useCallback(() => {
    setSelectedPaper(null);
  }, [setSelectedPaper]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    selectPaper,
    isPaperSelected,
    clearSelectedPaper,
    isSelecting,
    selectedPaper,
    hasSelectedPaper: selectedPaper !== null
  }), [selectPaper, isPaperSelected, clearSelectedPaper, isSelecting, selectedPaper]);
};
