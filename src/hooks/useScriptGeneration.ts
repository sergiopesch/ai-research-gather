import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Paper, ScriptModel, ScriptSpeakerConfig, ScriptSpeakerId } from '@/types/research';

type ScriptSegment = {
  speaker: string;
  speakerId: ScriptSpeakerId;
  speakerModel: ScriptModel;
  text: string;
  voiceId?: string;
  duration?: number;
};

export type { ScriptSegment };

type PodcastScript = {
  id: string;
  title: string;
  model?: ScriptModel;
  speakers?: ScriptSpeakerConfig[];
  segments: ScriptSegment[];
  totalDuration: string;
  createdAt: string;
};

const SPEAKER_1_VOICE_ID = "9BWtsMINqrJLrRacOk9x";
const SPEAKER_2_VOICE_ID = "TX3LPaxmHKxFdv7VOQHJ";

const normalizeSegmentText = (text: string): string =>
  text.replace(/^[\w .'-]{1,48}:\s*/i, '').trim();

const normalizeScript = (data: PodcastScript): PodcastScript => ({
  ...data,
  segments: data.segments.map((segment) => ({
    ...segment,
    text: normalizeSegmentText(segment.text),
  })),
});

const getScriptGenerationError = async (response: Response): Promise<string> => {
  const fallback = `Failed to generate script: ${response.status}`;
  const responseText = await response.text();

  if (!responseText) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(responseText) as { error?: string };
    if (parsed.error === "OPENAI_API_KEY is not configured") {
      return "OpenAI API key is missing. Add OPENAI_API_KEY to .env.local or export it before starting npm run dev, then restart the server.";
    }

    return parsed.error ? `${fallback} - ${parsed.error}` : `${fallback} - ${responseText}`;
  } catch {
    return `${fallback} - ${responseText}`;
  }
};

export const useScriptGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<PodcastScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateScript = useCallback(async (paper: Paper, speakers: ScriptSpeakerConfig[]) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    setScript(null);

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paper, speakers })
      });

      if (!response.ok) {
        throw new Error(await getScriptGenerationError(response));
      }

      const data = await response.json();
      const normalizedScript = normalizeScript(data);
      setScript(normalizedScript);
      
      toast({
        title: "Episode Script Generated",
        description: `Created ${normalizedScript.segments.length} conversation segments for your studio`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate podcast script';
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
    const elevenLabsFormat = {
      title: script.title,
      speakers: script.speakers,
      segments: script.segments.map((segment, index) => ({
        id: `segment_${index + 1}`,
        speaker: segment.speaker,
        model: segment.speakerModel,
        voice_id: segment.speakerId === "speaker_1" ? SPEAKER_1_VOICE_ID : SPEAKER_2_VOICE_ID,
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
      .map(segment => `${segment.speaker} (${segment.speakerModel}): ${segment.text}`)
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
