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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Studio
              </Link>
            </Button>
          </div>

          <div className="grid gap-6">
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <Headphones className="w-8 h-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                Studio Ready
              </h1>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Select a research paper to create your next podcast episode.
              </p>
              <Button asChild>
                <Link to="/">
                  Browse Research Papers
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Episode Library - moved to bottom */}
          <EpisodeLibrary />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Studio
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Podcast Studio</h1>
            <p className="text-muted-foreground">Episode creation workspace</p>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Selected Paper Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Selected Paper</CardTitle>
                  <p className="text-sm text-muted-foreground">Ready for script generation</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Selected</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleClearSelection}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground mb-2">Paper ID:</p>
                <p className="font-mono text-sm bg-background px-2 py-1 rounded border">
                  {selectedPaper}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Script Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mic2 className="w-5 h-5" />
                Podcast Script Generation
                {isGenerating && (
                  <Badge variant="default" className="bg-blue-500 text-white animate-pulse">
                    GENERATING
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create podcast episodes with Dr. Rowan and Alex
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex items-center gap-3">
                {!hasScript && !isGenerating && (
                  <Button 
                    onClick={handleGenerateScript}
                    disabled={!selectedPaper}
                    className="h-12 text-base font-semibold"
                    size="lg"
                  >
                    <Mic2 className="w-5 h-5 mr-3" />
                    Generate Podcast Script
                  </Button>
                )}

                {isGenerating && (
                  <Button 
                    disabled
                    className="h-12 text-base font-semibold"
                    size="lg"
                  >
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Generating Script...
                  </Button>
                )}

                {hasScript && !isGenerating && (
                  <>
                    <Button 
                      onClick={handleSaveEpisode}
                      className="h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <Headphones className="w-5 h-5 mr-3" />
                      Save to Studio
                    </Button>
                    
                    <Button 
                      onClick={() => downloadElevenLabsScript(script!)}
                      variant="outline"
                      size="lg"
                      className="h-12"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download ElevenLabs
                    </Button>
                    
                    <Button 
                      onClick={() => downloadTextScript(script!)}
                      variant="outline"
                      size="lg"
                      className="h-12"
                    >
                      <FileDown className="w-5 h-5 mr-2" />
                      Download Text
                    </Button>
                    
                    <Button 
                      onClick={clearScript}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-3 h-3 mr-2" />
                      Clear
                    </Button>
                  </>
                )}
              </div>

              {/* Script Preview */}
              {hasScript && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Generated Script</h4>
                      <p className="text-xs text-muted-foreground">
                        {script!.segments.length} segments • {script!.totalDuration} estimated duration
                      </p>
                    </div>
                  </div>

                  {/* Script Segments Display */}
                  <div className="space-y-3 max-h-80 overflow-y-auto bg-muted/20 rounded-lg p-4 border">
                    {script!.segments.map((segment, index) => (
                      <div 
                        key={index}
                        className="flex gap-3 p-3 rounded-lg bg-background/50 hover:bg-muted/40 transition-colors"
                      >
                         <div className="flex-shrink-0">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                             segment.speaker === "DR ROWAN" 
                               ? "bg-primary text-primary-foreground" 
                               : "bg-secondary text-secondary-foreground"
                           }`}>
                             {segment.speaker === "DR ROWAN" ? "R" : "A"}
                           </div>
                         </div>
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="text-sm font-medium">
                               {segment.speaker}
                             </span>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              Segment {index + 1}
                            </Badge>
                            {segment.duration && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                ~{Math.floor(segment.duration / 60)}:{(segment.duration % 60).toString().padStart(2, '0')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{segment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ElevenLabs Instructions */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">
                      📘 ElevenLabs Import Instructions
                    </h5>
                     <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
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
              <div className="space-y-3 pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-foreground">Script Features:</h3>
                <div className="grid gap-2">
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
            </CardContent>
          </Card>

          {/* Episode Library - moved to bottom */}
          <EpisodeLibrary />
        </div>
      </div>
    </div>
  );
};

export default ProcessingHub;