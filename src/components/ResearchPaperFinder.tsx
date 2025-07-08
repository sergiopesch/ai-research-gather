import React, { useState } from 'react';
import { Play, Loader2, ExternalLink, Calendar, FileText, Filter, Sparkles, Brain, Bot, Eye, Users } from 'lucide-react';
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
  authors?: string[];
  summary?: string;
  importance?: string;
}

const RESEARCH_AREAS = [{
  id: 'ai',
  label: 'Artificial Intelligence',
  icon: Brain,
  keywords: [
    'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'neural network', 
    'llm', 'language model', 'transformer', 'gpt', 'bert', 'nlp', 'natural language',
    'reinforcement learning', 'supervised learning', 'unsupervised learning', 'classification',
    'regression', 'clustering', 'generative', 'discriminative', 'attention', 'embedding'
  ],
  color: 'area-badge-ai',
  gradient: 'bg-gradient-ai'
}, {
  id: 'robotics',
  label: 'Robotics',
  icon: Bot,
  keywords: [
    'robotics', 'robot', 'autonomous', 'robotic', 'manipulation', 'navigation', 'slam', 
    'motion planning', 'humanoid', 'drone', 'uav', 'mobile robot', 'path planning',
    'localization', 'mapping', 'control', 'actuator', 'sensor fusion', 'kinematics'
  ],
  color: 'area-badge-robotics',
  gradient: 'bg-gradient-robotics'
}, {
  id: 'cv',
  label: 'Computer Vision',
  icon: Eye,
  keywords: [
    'computer vision', 'image processing', 'visual', 'vision', 'opencv', 'segmentation', 
    'detection', 'recognition', 'cnn', 'yolo', 'object detection', 'image classification',
    'face recognition', 'optical', 'pixel', 'convolution', 'feature extraction', 'tracking'
  ],
  color: 'area-badge-cv',
  gradient: 'bg-gradient-cv'
}];

const ResearchPaperFinder = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['ai', 'robotics', 'cv']);
  const { toast } = useToast();

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
      'arXiv': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      'Semantic Scholar': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800',
      'IEEE Xplore': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
    };
    return colors[source] || 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-300 dark:border-gray-800';
  };

  // Enhanced categorization with better keyword matching and scoring
  const getPaperAreaColor = (paperTitle: string) => {
    const title = paperTitle.toLowerCase();
    let bestMatch = { area: RESEARCH_AREAS[0], score: 0 };

    for (const area of RESEARCH_AREAS) {
      let score = 0;
      
      // Weighted scoring for different types of keywords
      for (const keyword of area.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (title.includes(keywordLower)) {
          // Higher score for exact matches of important terms
          if (['artificial intelligence', 'machine learning', 'deep learning', 'robotics', 'computer vision'].includes(keywordLower)) {
            score += 10;
          } else if (['ai', 'ml', 'cv', 'robot', 'vision'].includes(keywordLower)) {
            score += 5;
          } else {
            score += 1;
          }
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = { area, score };
      }
    }

    return {
      label: bestMatch.area.label,
      color: bestMatch.area.color,
      icon: bestMatch.area.icon
    };
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
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight">
                Research Paper Finder
              </h1>
            </div>
            <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Discover the latest breakthroughs in AI, Robotics, and Computer Vision with 
              <span className="font-semibold"> AI-powered summaries</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-10">
        {/* Research Area Filters */}
        <Card className="glass shadow-large border-0 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Research Areas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {RESEARCH_AREAS.map(area => {
                const Icon = area.icon;
                const isSelected = selectedAreas.includes(area.id);
                return (
                  <div 
                    key={area.id} 
                    className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? `${area.gradient} border-primary shadow-medium` 
                        : 'bg-card hover:bg-muted border-border hover:border-primary/30'
                    }`}
                    onClick={() => handleAreaToggle(area.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id={area.id} 
                        checked={isSelected} 
                        onChange={() => handleAreaToggle(area.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-primary/10'}`}>
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-primary'}`} />
                        </div>
                        <Label htmlFor={area.id} className="font-medium cursor-pointer">
                          {area.label}
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center mb-12">
          <Button 
            onClick={fetchTodaysPapers} 
            disabled={loading || selectedAreas.length === 0} 
            className="px-8 py-4 h-auto text-lg font-semibold bg-primary hover:bg-primary/90 shadow-glow transition-all duration-200 hover:scale-105"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Generating summary...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-3" />
                Discover Today's Papers
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {papers.length > 0 && (
          <div className="space-y-8 pb-16">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Latest Research Papers
                </h2>
                <p className="text-muted-foreground">
                  Papers from {formatDate(getTodaysDate())} • Powered by AI
                </p>
              </div>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                {papers.length} papers found
              </Badge>
            </div>

            <div className="grid gap-6">
              {papers.map((paper, index) => {
                const areaInfo = getPaperAreaColor(paper.title);
                const AreaIcon = areaInfo.icon;
                
                return (
                  <Card key={index} className="research-card group">
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        {/* Header with title and badges */}
                        <div className="flex items-start justify-between gap-6">
                          <h3 className="text-xl font-semibold text-foreground leading-relaxed flex-1 group-hover:text-primary transition-colors">
                            {paper.title}
                          </h3>
                          <div className="flex gap-3 flex-shrink-0">
                            <Badge variant="outline" className={areaInfo.color}>
                              <AreaIcon className="w-3 h-3 mr-1.5" />
                              {areaInfo.label}
                            </Badge>
                            <Badge variant="outline" className={getSourceColor(paper.source)}>
                              {paper.source}
                            </Badge>
                          </div>
                        </div>

                        {/* AI Summary */}
                        {paper.summary && (
                          <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-border/50">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-primary">AI Summary</span>
                              </div>
                              <p className="text-foreground leading-relaxed">
                                {paper.summary}
                              </p>
                              {paper.importance && (
                                <div className="pt-3 border-t border-border/50">
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    <span className="font-medium">Impact:</span> {paper.importance}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Metadata and Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="space-y-3">
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(paper.published_date)}
                              </span>
                              {paper.doi && (
                                <span className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  {paper.doi}
                                </span>
                              )}
                            </div>
                            {paper.authors && paper.authors.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">Authors:</span> 
                                <span>{paper.authors.join(', ')}</span>
                              </div>
                            )}
                          </div>
                          
                          <Button variant="outline" asChild className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <a href={paper.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4" />
                              Read Paper
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {papers.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-6">
                <FileText className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Ready to explore research?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Select your research areas above and click the discover button to find today's latest papers with AI-powered insights.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchPaperFinder;