import React, { useState } from 'react';
import { Play, Loader2, ExternalLink, Calendar, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
interface Paper {
  title: string;
  url: string;
  doi?: string;
  source: string;
  published_date: string;
  summary?: string;
  importance?: string;
}
const RESEARCH_AREAS = [{
  id: 'ai',
  label: 'Artificial Intelligence',
  keywords: ['artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'neural network', 'llm', 'language model', 'transformer', 'gpt', 'bert', 'nlp', 'natural language'],
  color: 'bg-blue-50 text-blue-700 border-blue-200'
}, {
  id: 'robotics',
  label: 'Robotics',
  keywords: ['robotics', 'robot', 'autonomous', 'robotic', 'manipulation', 'navigation', 'slam', 'motion planning', 'humanoid', 'drone', 'uav'],
  color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
}, {
  id: 'cv',
  label: 'Computer Vision',
  keywords: ['computer vision', 'image processing', 'visual', 'vision', 'opencv', 'segmentation', 'detection', 'recognition', 'cnn', 'yolo', 'object detection', 'image classification'],
  color: 'bg-purple-50 text-purple-700 border-purple-200'
}];
const ResearchPaperFinder = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['ai', 'robotics', 'cv']);
  const {
    toast
  } = useToast();
  const getTodaysDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };
  const getSelectedKeywords = () => {
    return selectedAreas.flatMap(areaId => {
      const area = RESEARCH_AREAS.find(a => a.id === areaId);
      return area ? area.keywords : [];
    });
  };
  const handleAreaToggle = (areaId: string) => {
    setSelectedAreas(prev => prev.includes(areaId) ? prev.filter(id => id !== areaId) : [...prev, areaId]);
  };
  const fetchTodaysPapers = async () => {
    if (selectedAreas.length === 0) {
      toast({
        title: "No research areas selected",
        description: "Please select at least one research area to search for papers.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const today = getTodaysDate();
      const apiUrl = 'https://eapnatbiodenijfrpqcn.supabase.co/functions/v1/paperFinder';
      const keywords = getSelectedKeywords();
      console.log('Making API call to:', apiUrl);
      console.log('Request body:', {
        since: today,
        keywords,
        limit: 5
      });

      // Real API call to Supabase function
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          since: today,
          keywords,
          limit: 5
        })
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      setPapers(data.papers);
      toast({
        title: "Papers fetched successfully",
        description: `Found ${data.papers.length} papers with AI-generated summaries`
      });
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Failed to fetch papers",
        description: error instanceof Error ? error.message : "Please check your connection and try again",
        variant: "destructive"
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
  const getPaperAreaColor = (paperTitle: string) => {
    const title = paperTitle.toLowerCase();

    // Check which research area this paper belongs to based on keywords
    for (const area of RESEARCH_AREAS) {
      if (area.keywords.some(keyword => title.includes(keyword.toLowerCase()))) {
        return {
          label: area.label,
          color: area.color
        };
      }
    }

    // Default to AI if no specific match found (since most papers are AI-related)
    return {
      label: 'Artificial Intelligence',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  return <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-foreground mb-2">
            Research Paper Finder
          </h1>
          <p className="text-muted-foreground">Latest top 5 research papers in AI, Robotics, and Computer Vision</p>
        </div>

        {/* Research Area Filters */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4" />
              <h3 className="text-sm font-medium">Research Areas</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {RESEARCH_AREAS.map(area => <div key={area.id} className="flex items-center space-x-2">
                  <Checkbox id={area.id} checked={selectedAreas.includes(area.id)} onCheckedChange={() => handleAreaToggle(area.id)} />
                  <Label htmlFor={area.id} className="text-sm cursor-pointer">
                    {area.label}
                  </Label>
                </div>)}
            </div>
          </Card>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          <Button onClick={fetchTodaysPapers} disabled={loading || selectedAreas.length === 0} className="px-6 py-3 h-auto text-base font-medium">
            {loading ? <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating summary...
              </> : <>
                <Play className="w-4 h-4 mr-2" />
                Fetch Today's Papers
              </>}
          </Button>
        </div>

        {/* Results */}
        {papers.length > 0 && <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-foreground">
                Latest Papers ({formatDate(getTodaysDate())})
              </h2>
              <Badge variant="secondary" className="text-sm">
                {papers.length} papers
              </Badge>
            </div>

            <div className="space-y-4">
              {papers.map((paper, index) => <Card key={index} className="border border-border hover:border-border/80 transition-colors">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {/* Title, Source, and Research Area */}
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-base font-medium text-foreground leading-snug flex-1">
                          {paper.title}
                        </h3>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={getPaperAreaColor(paper.title).color}>
                            {getPaperAreaColor(paper.title).label}
                          </Badge>
                          <Badge variant="outline" className={getSourceColor(paper.source)}>
                            {paper.source}
                          </Badge>
                        </div>
                      </div>

                      {/* AI-Generated Summary */}
                      {paper.summary && <div className="space-y-2">
                          <div className="text-sm text-foreground leading-relaxed">
                            <span className="font-medium">What it's about:</span> {paper.summary}
                          </div>
                          {paper.importance && <div className="text-sm text-muted-foreground leading-relaxed">
                              <span className="font-medium">Why it matters:</span> {paper.importance}
                            </div>}
                        </div>}

                      {/* Metadata and Link */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(paper.published_date)}
                          </span>
                          {paper.doi && <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {paper.doi}
                            </span>}
                        </div>
                        
                        <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-xs">
                          <a href={paper.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Read Paper
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>}

        {/* Empty State */}
        {papers.length === 0 && !loading && <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base font-medium text-foreground mb-2">
                No papers loaded
              </h3>
              <p className="text-sm text-muted-foreground">
                Click the button above to fetch today's latest research papers.
              </p>
            </div>
          </div>}

        {/* Daily Schedule Note */}
        
      </div>
    </div>;
};
export default ResearchPaperFinder;