import React, { useState } from 'react';
import { Play, Loader2, ExternalLink, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Paper {
  title: string;
  url: string;
  doi?: string;
  source: string;
  published_date: string;
  summary?: string; // Note: API doesn't provide this yet
}

const ResearchPaperFinder = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getTodaysDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const fetchTodaysPapers = async () => {
    setLoading(true);
    
    try {
      const today = getTodaysDate();
      const apiUrl = 'https://eapnatbiodenijfrpqcn.supabase.co/functions/v1/paperFinder';
      
      console.log('Making API call to:', apiUrl);
      console.log('Request body:', {
        since: today,
        keywords: ["artificial intelligence", "machine learning", "robotics", "computer vision"],
        limit: 5
      });
      
      // Real API call to Supabase function
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          since: today,
          keywords: ["artificial intelligence", "machine learning", "robotics", "computer vision"],
          limit: 5
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setPapers(data.papers);
      
      toast({
        title: "Papers fetched from arXiv",
        description: `Found ${data.papers.length} papers published since ${formatDate(today)}`,
      });
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Failed to fetch papers",
        description: error instanceof Error ? error.message : "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'arXiv': 'bg-blue-50 text-blue-700 border-blue-200',
      'Semantic Scholar': 'bg-green-50 text-green-700 border-green-200',
      'IEEE Xplore': 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[source] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-foreground mb-2">
            Research Paper Finder
          </h1>
          <p className="text-muted-foreground">
            Get today's top 5 research papers in AI, ML, Robotics, and Computer Vision
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={fetchTodaysPapers}
            disabled={loading}
            className="px-6 py-3 h-auto text-base font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching papers...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Fetch Today's Papers
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {papers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-foreground">
                Latest Papers ({formatDate(getTodaysDate())})
              </h2>
              <Badge variant="secondary" className="text-sm">
                {papers.length} papers
              </Badge>
            </div>

            <div className="space-y-4">
              {papers.map((paper, index) => (
                <Card key={index} className="border border-border hover:border-border/80 transition-colors">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {/* Title and Source */}
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-base font-medium text-foreground leading-snug flex-1">
                          {paper.title}
                        </h3>
                        <Badge variant="outline" className={getSourceColor(paper.source)}>
                          {paper.source}
                        </Badge>
                      </div>

                      {/* Summary Placeholder */}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {paper.summary || "Summary not available - this feature requires additional processing of the paper content."}
                      </p>

                      {/* Metadata and Link */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(paper.published_date)}
                          </span>
                          {paper.doi && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {paper.doi}
                            </span>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 px-3 text-xs"
                        >
                          <a 
                            href={paper.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Read Paper
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {papers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base font-medium text-foreground mb-2">
                No papers loaded
              </h3>
              <p className="text-sm text-muted-foreground">
                Click the button above to fetch today's latest research papers.
              </p>
            </div>
          </div>
        )}

        {/* Daily Schedule Note */}
        <div className="mt-12 p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Note:</strong> This app is designed for daily paper discovery. 
            In production, it could automatically fetch papers daily and cache results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResearchPaperFinder;