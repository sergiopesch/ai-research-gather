import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

export type ScriptSegment = {
  speaker: "DR ROWAN" | "ALEX";
  text: string;
  voiceId?: string;
  duration?: number;
};

export type PodcastScript = {
  id: string;
  title: string;
  segments: ScriptSegment[];
  totalDuration: string;
  createdAt: string;
};

export const useScriptGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<PodcastScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateScript = useCallback(async (paperId: string) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    setScript(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generatePodcastScript`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paper_id: paperId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate script: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setScript(data);
      
      toast({
        title: "Episode Script Generated",
        description: `Created ${data.segments.length} conversation segments for your studio`,
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to generate podcast script';
      setError(errorMessage);
      toast({
        title: "Script Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, toast]);

  const downloadElevenLabsScript = useCallback((script: PodcastScript) => {
    // Create ElevenLabs compatible format
    const elevenLabsFormat = {
      title: script.title,
      segments: script.segments.map((segment, index) => ({
        id: `segment_${index + 1}`,
        speaker: segment.speaker,
        voice_id: segment.speaker === "DR ROWAN" ? "9BWtsMINqrJLrRacOk9x" : "TX3LPaxmHKxFdv7VOQHJ", // Aria for Dr Rowan, Liam for Alex
        text: segment.text,
        settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }))
    };

    const blob = new Blob([JSON.stringify(elevenLabsFormat, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podcast-script-${script.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Script Downloaded",
      description: "ElevenLabs-compatible script file downloaded successfully",
    });
  }, [toast]);

  const downloadTextScript = useCallback((script: PodcastScript) => {
    const textContent = script.segments
      .map(segment => `${segment.speaker}: ${segment.text}`)
      .join('\n\n');
    
    const fullScript = `# ${script.title}\n\nGenerated: ${new Date(script.createdAt).toLocaleString()}\nTotal Duration: ${script.totalDuration}\n\n---\n\n${textContent}`;
    
    const blob = new Blob([fullScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podcast-script-${script.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Text Script Downloaded",
      description: "Plain text script file downloaded successfully",
    });
  }, [toast]);

  const clearScript = useCallback(() => {
    setScript(null);
    setError(null);
  }, []);

  return {
    generateScript,
    downloadElevenLabsScript,
    downloadTextScript,
    clearScript,
    isGenerating,
    script,
    error,
    hasScript: !!script,
  };
};