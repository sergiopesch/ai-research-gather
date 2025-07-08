import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePaperActions = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const selectPaper = async (paperId: string) => {
    setIsSelecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('selectPaper', {
        body: { paper_id: paperId }
      });

      if (error) throw error;

      toast({
        title: "Paper Selected",
        description: "Paper has been queued for processing",
      });

      return data;
    } catch (error) {
      console.error('Error selecting paper:', error);
      toast({
        title: "Selection Failed",
        description: error instanceof Error ? error.message : "Failed to select paper",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSelecting(false);
    }
  };

  const processPaper = async (paperId: string, model?: string) => {
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
    } catch (error) {
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
  };

  return {
    selectPaper,
    processPaper,
    isSelecting,
    isProcessing
  };
};