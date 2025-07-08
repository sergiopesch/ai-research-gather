import React, { useState } from 'react';
import { Search, Calendar, Filter, FileText, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Paper {
  title: string;
  url: string;
  doi?: string;
  source: string;
  published_date: string;
}

interface SearchFilters {
  since: string;
  keywords: string[];
  limit: number;
}

const PaperFinder = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    since: '2024-01-01',
    keywords: [],
    limit: 15
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addKeyword = () => {
    if (keywordInput.trim() && !filters.keywords.includes(keywordInput.trim())) {
      setFilters(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFilters(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const searchPapers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/functions/v1/paperFinder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch papers');
      }

      const data = await response.json();
      setPapers(data.papers);
      
      toast({
        title: "Search completed",
        description: `Found ${data.papers.length} papers`,
      });
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'arXiv': 'bg-blue-100 text-blue-800',
      'Semantic Scholar': 'bg-green-100 text-green-800',
      'IEEE Xplore': 'bg-purple-100 text-purple-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-hero text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Discover Latest AI & Robotics Research
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Find the newest open-access papers from arXiv, Semantic Scholar, and IEEE Xplore
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <Card className="shadow-large bg-gradient-card border-0">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Date Filter */}
              <div className="space-y-2">
                <Label htmlFor="since" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Papers since
                </Label>
                <Input
                  id="since"
                  type="date"
                  value={filters.since}
                  onChange={(e) => setFilters(prev => ({ ...prev, since: e.target.value }))}
                  className="border-2"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Keywords
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    className="border-2"
                  />
                  <Button onClick={addKeyword} variant="outline" size="icon">
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeKeyword(keyword)}
                    >
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Limit */}
              <div className="space-y-2">
                <Label htmlFor="limit">Results limit</Label>
                <Input
                  id="limit"
                  type="number"
                  min="1"
                  max="50"
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 15 }))}
                  className="border-2"
                />
              </div>
            </div>

            <Button
              onClick={searchPapers}
              disabled={loading}
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-medium"
            >
              <Search className="mr-2 h-5 w-5" />
              {loading ? 'Searching...' : 'Search Papers'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-12">
        {papers.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Found {papers.length} papers</h2>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Results
              </Button>
            </div>

            <div className="grid gap-6">
              {papers.map((paper, index) => (
                <Card key={index} className="shadow-medium hover:shadow-large transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-2 leading-tight">
                          {paper.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {paper.published_date}
                          </span>
                          {paper.doi && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              DOI: {paper.doi}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={getSourceColor(paper.source)}>
                        {paper.source}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={paper.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            View Paper
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

        {papers.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
              <h3 className="text-2xl font-semibold mb-4">No papers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or date range to find more papers.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperFinder;