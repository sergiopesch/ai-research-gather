import { ArrowLeft, FileText, Loader2, X, Download, FileDown, Mic2, Headphones, Lightbulb, Zap, CheckCircle, Clock } from 'lucide-react';
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
        <div className="premium-hero min-h-[60vh]">
          <div className="organic-bg">
            <div className="absolute top-20 left-20 w-64 h-64 bg-muted/20 rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-48 h-48 bg-muted/20 rounded-full"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-16">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Research</span>
            </Link>
            
            <div className="max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border/30 mb-6">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Production Studio</span>
              </div>
              
              <h1 className="text-display mb-6">
                Select Research to
                <span className="block text-foreground">
                  Create Episodes
                </span>
              </h1>
              
              <p className="text-subheading text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                Choose a research paper from the discovery page to begin transforming it into an engaging podcast episode.
              </p>
              
              <Button asChild className="comet-button">
                <Link to="/">
                  Browse Research Papers
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Episode Library */}
        <div className="premium-section">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <EpisodeLibrary />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <div className="premium-section py-12 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center gap-6 mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Research</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-xl shadow-soft">
              <Mic2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-heading">Production Studio</h1>
              <p className="text-body text-muted-foreground">Transform research into podcast episodes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 space-y-16">
        {/* Selected Paper Card */}
        <div className="premium-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-xl shadow-soft">
                <FileText className="w-6 h-6 text-ai-primary" />
              </div>
              <div>
                <h2 className="text-subheading text-foreground">Selected Research Paper</h2>
                <p className="text-caption">Ready for podcast script generation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-foreground border border-border">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">Selected</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearSelection}
                className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="bg-muted p-6 rounded-xl border border-border/50">
            <p className="text-caption mb-3">Paper Identifier:</p>
            <div className="p-3 bg-muted rounded-lg border font-mono text-sm">
              {selectedPaper}
            </div>
          </div>
        </div>

        {/* Script Generation */}
        <div className="premium-card p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-xl shadow-soft">
                <Zap className="w-6 h-6 text-robotics-primary" />
              </div>
              <div>
                <h2 className="text-subheading text-foreground">AI Script Generation</h2>
                <p className="text-caption">Professional podcast scripts with Dr. Rowan and Alex</p>
              </div>
            </div>
            {isGenerating && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">Generating</span>
              </div>
            )}
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {!hasScript && !isGenerating && (
              <button 
                onClick={handleGenerateScript}
                disabled={!selectedPaper}
                className="comet-button inline-flex items-center gap-3"
              >
                <Mic2 className="w-6 h-6" />
                Generate Podcast Script
              </button>
            )}

            {isGenerating && (
              <button 
                disabled
                className="bg-muted text-muted-foreground px-8 py-4 rounded-full text-lg inline-flex items-center gap-3 cursor-not-allowed"
              >
                <Loader2 className="w-6 h-6 animate-spin" />
                Generating Script...
              </button>
            )}

            {hasScript && !isGenerating && (
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={handleSaveEpisode}
                  className="bg-foreground text-background hover:bg-foreground/90 px-8 py-4 rounded-full text-lg inline-flex items-center gap-3 hover-scale shadow-lg"
                >
                  <Headphones className="w-6 h-6" />
                  Save to Studio
                </button>
                
                <button 
                  onClick={() => downloadElevenLabsScript(script!)}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-4 rounded-full inline-flex items-center gap-2 hover-scale border border-border"
                >
                  <Download className="w-5 h-5" />
                  Download ElevenLabs
                </button>
                
                <button 
                  onClick={() => downloadTextScript(script!)}
                  className="comet-button-secondary inline-flex items-center gap-2"
                >
                  <FileDown className="w-5 h-5" />
                  Download Text
                </button>
                
                <Button 
                  onClick={clearScript}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3 mr-2" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Script Preview */}
          {hasScript && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-muted rounded-xl border border-border/50">
                <div>
                  <h3 className="text-subheading text-foreground">Generated Script Preview</h3>
                  <p className="text-caption">
                    {script!.segments.length} segments • {script!.totalDuration} estimated duration
                  </p>
                </div>
              </div>

              {/* Script Segments Display */}
              <div className="space-y-4 max-h-96 overflow-y-auto bg-muted rounded-xl p-6 border border-border/50">
                {script!.segments.map((segment, index) => (
                  <div 
                    key={index}
                    className="flex gap-4 p-4 rounded-xl bg-background/50 hover:bg-background/80 transition-colors border border-border/30"
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        segment.speaker === "DR ROWAN" 
                          ? "bg-muted text-foreground border-2 border-border" 
                          : "bg-secondary text-secondary-foreground border-2 border-border"
                      }`}>
                        {segment.speaker === "DR ROWAN" ? "R" : "A"}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-foreground">
                          {segment.speaker}
                        </span>
                        <div className="px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                          Segment {index + 1}
                        </div>
                        {segment.duration && (
                          <div className="px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                            ~{Math.floor(segment.duration / 60)}:{(segment.duration % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-foreground">{segment.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ElevenLabs Instructions */}
              <div className="p-6 bg-muted rounded-xl border border-border">
                <h4 className="font-semibold text-sm mb-3 text-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  ElevenLabs Integration Guide
                </h4>
                <ul className="text-sm text-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-foreground rounded-full mt-2 flex-shrink-0"></div>
                    <span>Download the ElevenLabs JSON file using the button above</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-foreground rounded-full mt-2 flex-shrink-0"></div>
                    <span>Dr. Rowan uses voice: <strong>Aria</strong> (9BWtsMINqrJLrRacOk9x)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-foreground rounded-full mt-2 flex-shrink-0"></div>
                    <span>Alex uses voice: <strong>Liam</strong> (TX3LPaxmHKxFdv7VOQHJ)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-foreground rounded-full mt-2 flex-shrink-0"></div>
                    <span>Import the JSON into ElevenLabs Projects or use their API</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="space-y-4 pt-6 border-t border-border/30">
            <h3 className="text-subheading text-foreground">Script Features</h3>
            <div className="grid gap-3">
              {[
                "Natural conversation between Dr. Rowan (expert) and Alex (host)",
                "ElevenLabs JSON format with optimized voice settings",
                "Structured segments with estimated timing",
                "Engaging dialogue flow for podcast format",
                "Optimized for text-to-speech synthesis"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Episode Library */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-heading mb-4">Episode Library</h2>
            <p className="text-body text-muted-foreground">
              Manage your created podcast episodes
            </p>
          </div>
          <EpisodeLibrary />
        </div>
      </div>
    </div>
  );
};

export default ProcessingHub;