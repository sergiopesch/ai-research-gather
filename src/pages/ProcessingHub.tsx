import { useState } from 'react';
import { ArrowLeft, Brain, FileText, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePaperActions } from '@/hooks/usePaperActions';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

const ProcessingHub = () => {
  const { selectedPaper, hasSelectedPaper, processPaper, isProcessing } = usePaperActions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

  const handleProcessPaper = async () => {
    if (!selectedPaper) {
      toast({
        title: "No Paper Selected",
        description: "Please select a paper first",
        variant: "destructive",
      });
      return;
    }

    try {
      await processPaper(selectedPaper, selectedModel);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

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
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              No Paper Selected
            </h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Select a research paper from the discovery page to begin processing and analysis.
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
            <h1 className="text-2xl font-bold text-foreground">Processing Hub</h1>
            <p className="text-muted-foreground">Transform research papers into actionable insights</p>
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
                <div>
                  <CardTitle className="text-lg">Selected Paper</CardTitle>
                  <p className="text-sm text-muted-foreground">Ready for processing</p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Selected
                </Badge>
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

          {/* Processing Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Brain className="w-5 h-5" />
                AI Processing Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  AI Model Selection
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedModel('gpt-4o')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedModel === 'gpt-4o'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">GPT-4O</div>
                    <div className="text-xs text-muted-foreground">
                      Advanced reasoning and analysis
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedModel('gpt-4o-mini')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedModel === 'gpt-4o-mini'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">GPT-4O Mini</div>
                    <div className="text-xs text-muted-foreground">
                      Fast and efficient processing
                    </div>
                  </button>
                </div>
              </div>

              <Separator />

              {/* Processing Features */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">What you'll get:</h3>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Intelligent paper summary and key insights</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Podcast-style audio script generation</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Key findings and methodology breakdown</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Process Button */}
              <Button 
                onClick={handleProcessPaper}
                disabled={isProcessing}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Processing Paper...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-3" />
                    Start Processing
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProcessingHub;