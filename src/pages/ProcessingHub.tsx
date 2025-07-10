import { ArrowLeft, FileText, Loader2, X, Download, FileDown, Mic2, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePaperActions } from '@/hooks/usePaperActions';
import { useScriptGeneration } from '@/hooks/useScriptGeneration';
import { useEpisodes } from '@/hooks/useEpisodes';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { EpisodeLibrary } from '@/components/studio/EpisodeLibrary';

const ProcessingHub = () => {
  const { selectedPaper, hasSelectedPaper, clearSelectedPaper } = usePaperActions();
  const { 
    generateScript,
    downloadElevenLabsScript,
    downloadTextScript,
    clearScript,
    isGenerating, 
    script, 
    error,
    hasScript
  } = useScriptGeneration();
  const { createEpisode } = useEpisodes();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleClearSelection = useCallback(() => {
    clearSelectedPaper();
    clearScript();
    navigate('/');
  }, [clearSelectedPaper, clearScript, navigate]);

  const handleGenerateScript = useCallback(async () => {
    if (!selectedPaper) {
      toast({
        title: "No Paper Selected",
        description: "Please select a paper first",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateScript(selectedPaper);
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [selectedPaper, generateScript, toast]);

  const handleSaveEpisode = useCallback(async () => {
    if (!script || !selectedPaper) return;
    
    try {
      await createEpisode(selectedPaper, script.title, script);
      toast({
        title: "Episode Saved",
        description: "Episode has been added to your studio library",
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [script, selectedPaper, createEpisode, toast]);

  if (!hasSelectedPaper) {
    return (
      <div className="min-h-screen bg-background">
        <div className="comet-hero">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="sm" asChild className="modern-button-secondary">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Studio
                </Link>
              </Button>
            </div>

            <div className="py-16">
              <div className="w-20 h-20 mx-auto mb-8 bg-gradient-card rounded-3xl flex items-center justify-center shadow-soft">
                <Headphones className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-light text-foreground mb-6">
                Studio Ready
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                Select a research paper to create your next podcast episode.
              </p>
              <Button asChild className="modern-button px-8 py-4 rounded-full">
                <Link to="/">
                  Browse Research Papers
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Episode Library moved to bottom */}
        <div className="comet-section py-16">
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <EpisodeLibrary />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="comet-section py-8">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild className="modern-button-secondary">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Studio
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-light text-foreground">Podcast Studio</h1>
              <p className="text-muted-foreground">Episode creation workspace</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-12">
        {/* Selected Paper Card */}
        <div className="modern-card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-card rounded-2xl flex items-center justify-center shadow-soft">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-light text-foreground">Selected Paper</h2>
              <p className="text-muted-foreground">Ready for script generation</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1 rounded-full">Selected</Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearSelection}
                className="modern-button-secondary h-10 w-10 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="bg-gradient-card p-6 rounded-2xl border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Paper ID:</p>
            <p className="font-mono text-sm bg-background px-3 py-2 rounded-lg border">
              {selectedPaper}
            </p>
          </div>
        </div>

        {/* Script Generation */}
        <div className="modern-card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-card rounded-2xl flex items-center justify-center shadow-soft">
              <Mic2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-light text-foreground">Podcast Script Generation</h2>
              <p className="text-muted-foreground">
                Create podcast episodes with Dr. Rowan and Alex
              </p>
            </div>
            {isGenerating && (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 rounded-full animate-pulse">
                GENERATING
              </Badge>
            )}
          </div>
          
          <div className="space-y-8">
            {/* Error Display */}
            {error && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              {!hasScript && !isGenerating && (
                <button 
                  onClick={handleGenerateScript}
                  disabled={!selectedPaper}
                  className="modern-button px-8 py-4 rounded-full text-lg font-medium inline-flex items-center gap-3"
                >
                  <Mic2 className="w-6 h-6" />
                  Generate Podcast Script
                </button>
              )}

              {isGenerating && (
                <button 
                  disabled
                  className="bg-muted text-muted-foreground px-8 py-4 rounded-full text-lg font-medium inline-flex items-center gap-3"
                >
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating Script...
                </button>
              )}

              {hasScript && !isGenerating && (
                <>
                  <button 
                    onClick={handleSaveEpisode}
                    className="bg-green-600 text-white hover:bg-green-700 px-8 py-4 rounded-full text-lg font-medium inline-flex items-center gap-3 transition-all duration-300 hover:scale-105"
                  >
                    <Headphones className="w-6 h-6" />
                    Save to Studio
                  </button>
                  
                  <button 
                    onClick={() => downloadElevenLabsScript(script!)}
                    className="modern-button-secondary px-6 py-4 rounded-full inline-flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download ElevenLabs
                  </button>
                  
                  <button 
                    onClick={() => downloadTextScript(script!)}
                    className="modern-button-secondary px-6 py-4 rounded-full inline-flex items-center gap-2"
                  >
                    <FileDown className="w-5 h-5" />
                    Download Text
                  </button>
                  
                  <Button 
                    onClick={clearScript}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3 mr-2" />
                    Clear
                  </Button>
                </>
              )}
            </div>

            {/* Script Preview */}
            {hasScript && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">Generated Script</h3>
                    <p className="text-sm text-muted-foreground">
                      {script!.segments.length} segments • {script!.totalDuration} estimated duration
                    </p>
                  </div>
                </div>

                {/* Script Segments Display */}
                <div className="space-y-4 max-h-96 overflow-y-auto bg-gradient-card rounded-2xl p-6 border border-border/50">
                  {script!.segments.map((segment, index) => (
                    <div 
                      key={index}
                      className="flex gap-4 p-4 rounded-xl bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          segment.speaker === "DR ROWAN" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary text-secondary-foreground"
                        }`}>
                          {segment.speaker === "DR ROWAN" ? "R" : "A"}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium">
                            {segment.speaker}
                          </span>
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            Segment {index + 1}
                          </Badge>
                          {segment.duration && (
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              ~{Math.floor(segment.duration / 60)}:{(segment.duration % 60).toString().padStart(2, '0')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">{segment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ElevenLabs Instructions */}
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                  <h4 className="font-medium text-sm mb-3 text-blue-900">
                    📘 ElevenLabs Import Instructions
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Download the ElevenLabs JSON file above</li>
                    <li>• Dr. Rowan uses voice: <strong>Aria</strong> (9BWtsMINqrJLrRacOk9x)</li>
                    <li>• Alex uses voice: <strong>Liam</strong> (TX3LPaxmHKxFdv7VOQHJ)</li>
                    <li>• Import the JSON into ElevenLabs Projects or use the API</li>
                    <li>• Adjust voice settings (stability: 0.5, similarity: 0.75) as needed</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Features List */}
            <div className="space-y-4 pt-6 border-t border-border/50">
              <h3 className="text-lg font-medium text-foreground">Script Features:</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Conversation between Dr. Rowan (expert) and Alex (host)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>ElevenLabs JSON format with voice settings</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Structured segments with timing</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Natural conversation flow</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Optimized for text-to-speech</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Episode Library - moved to bottom */}
        <EpisodeLibrary />
      </div>
    </div>
  );
};

export default ProcessingHub;