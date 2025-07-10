import { ArrowLeft, FileText, Loader2, X, Mic, Square, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePaperActions } from '@/hooks/usePaperActions';
import { usePodcastPreview } from '@/hooks/usePodcastPreview';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { TypingAnimation } from '@/components/TypingAnimation';

const ProcessingHub = () => {
  const { selectedPaper, hasSelectedPaper, clearSelectedPaper } = usePaperActions();
  const { 
    generateLivePreview,
    stopConversation,
    clearPreview,
    isGenerating, 
    dialogue, 
    isLive,
    hasDialogue,
    currentTypingSpeaker
  } = usePodcastPreview();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleClearSelection = useCallback(() => {
    clearSelectedPaper();
    clearPreview();
    navigate('/');
  }, [clearSelectedPaper, clearPreview, navigate]);

  const handleGenerateLivePreview = useCallback(async () => {
    if (!selectedPaper) {
      toast({
        title: "No Paper Selected",
        description: "Please select a paper first",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateLivePreview(selectedPaper, 1, 10);
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [selectedPaper, generateLivePreview, toast]);

  const handleStopConversation = useCallback(() => {
    stopConversation();
  }, [stopConversation]);

  if (!hasSelectedPaper) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Papers
              </Link>
            </Button>
          </div>

          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <Radio className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              No Paper Selected
            </h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Select a research paper from the discovery page to start a live podcast conversation.
            </p>
            <Button asChild>
              <Link to="/">
                Discover Papers
              </Link>
            </Button>
          </div>
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
              Back to Papers
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">The Notebook Pod</h1>
            <p className="text-muted-foreground">Live AI conversation between Dr. Ada and Sam (GPT-4.1 models)</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Selected Paper Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Selected Paper</CardTitle>
                  <p className="text-sm text-muted-foreground">Ready for live podcast conversation</p>
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

          {/* Live Podcast Conversation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Radio className="w-5 h-5" />
                Live Conversation
                {isLive && (
                  <Badge variant="default" className="bg-red-500 text-white animate-pulse">
                    LIVE
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Watch two AI models have a real conversation about this research paper
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Control Buttons */}
              <div className="flex items-center gap-3">
                {!isLive && !isGenerating && (
                  <Button 
                    onClick={handleGenerateLivePreview}
                    disabled={!selectedPaper}
                    className="h-12 text-base font-semibold"
                    size="lg"
                  >
                    <Mic className="w-5 h-5 mr-3" />
                    Start Live Conversation
                  </Button>
                )}

                {isGenerating && (
                  <Button 
                    disabled
                    className="h-12 text-base font-semibold"
                    size="lg"
                  >
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Starting Conversation...
                  </Button>
                )}

                {isLive && (
                  <Button 
                    onClick={handleStopConversation}
                    variant="destructive"
                    className="h-12 text-base font-semibold"
                    size="lg"
                  >
                    <Square className="w-5 h-5 mr-3" />
                    Stop Conversation
                  </Button>
                )}

                {hasDialogue && !isLive && !isGenerating && (
                  <Button 
                    onClick={clearPreview}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-3 h-3 mr-2" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Live Conversation Display */}
              {hasDialogue && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Live Episode</h4>
                      <p className="text-xs text-muted-foreground">
                        {dialogue.length} messages {isLive ? '• Live' : '• Completed'}
                      </p>
                    </div>
                  </div>

                  {/* Real-time Dialogue Display with Typing Animation */}
                  <div className="space-y-3 max-h-80 overflow-y-auto bg-muted/20 rounded-lg p-4 border">
                    {dialogue.map((utterance, index) => (
                      <div 
                        key={index}
                        className={`flex gap-3 p-3 rounded-lg transition-all duration-300 ${
                          index === dialogue.length - 1 && isLive
                            ? 'bg-primary/10 border border-primary/20 scale-[1.02] animate-fade-in' 
                            : 'bg-background/50 hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            utterance.speaker === "Dr Ada" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-secondary text-secondary-foreground"
                          }`}>
                            {utterance.speaker === "Dr Ada" ? "A" : "S"}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {utterance.speaker}
                            </span>
                            {utterance.exchange && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                #{utterance.exchange}
                              </Badge>
                            )}
                            {index === dialogue.length - 1 && isLive && (
                              <div className="flex items-center gap-1 ml-auto">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-600 font-medium">LATEST</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{utterance.text}</p>
                          {utterance.timestamp && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(utterance.timestamp).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Animation */}
                    <TypingAnimation 
                      speaker={currentTypingSpeaker || "Dr Ada"} 
                      isVisible={currentTypingSpeaker !== null} 
                    />
                    
                    {/* Generic "thinking" indicator when live but not typing */}
                    {isLive && !currentTypingSpeaker && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-dashed">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">AI conversation in progress...</span>
                      </div>
                    )}
                  </div>

                  {isLive && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>🎙️ LIVE: Real-time AI conversation • Two independent GPT-4.1 instances</span>
                      <div className="ml-auto flex items-center gap-1">
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                      <div className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                        {dialogue.length} messages
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Features List */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-foreground">Live Features:</h3>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Real-time conversation between two independent AI agents</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>GPT-4.1 (Dr. Ada) • Research expert & technical analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>GPT-4.1 (Sam) • Curious interviewer & accessibility focus</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Live typing indicators • Natural conversation flow</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Contextual responses • Authentic AI-to-AI dialogue</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProcessingHub;