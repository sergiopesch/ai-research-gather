import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePaperActions = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const selectPaper = useCallback(async (paperId: string) => {
    console.log('🔥 MOBILE DEBUG: selectPaper called with:', { paperId, isSelecting, hasSelected: selectedPapers.has(paperId) });
    
    if (isSelecting || selectedPapers.has(paperId)) {
      console.log('🚫 MOBILE DEBUG: Early return - already selecting or selected');
      return;
    }
    
    setIsSelecting(true);
    try {
      console.log('🚀 MOBILE DEBUG: Invoking selectPaper function...');
      const { data, error } = await supabase.functions.invoke('selectPaper', {
        body: { paper_id: paperId }
      });

      console.log('📡 MOBILE DEBUG: Function response:', { data, error });

      if (error) throw error;

      setSelectedPapers(prev => new Set(prev).add(paperId));
      
      toast({
        title: "Paper Selected",
        description: "Paper has been queued for processing",
      });

      console.log('✅ MOBILE DEBUG: Selection completed successfully');
      return data;
    } catch (error: any) {
      console.error('❌ MOBILE DEBUG: Error selecting paper:', error);
      
      // Handle specific error cases with better messaging
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
      console.log('🏁 MOBILE DEBUG: setIsSelecting(false) called');
    }
  }, [isSelecting, selectedPapers, toast]);

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
    return selectedPapers.has(paperId);
  }, [selectedPapers]);

  return {
    selectPaper,
    processPaper,
    isPaperSelected,
    isSelecting,
    isProcessing,
    selectedPapersCount: selectedPapers.size
  };
};