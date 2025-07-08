import { Calendar, FileText, ExternalLink, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RESEARCH_AREAS } from '@/constants/research-areas';
import type { Paper } from '@/types/research';

interface PaperCardProps {
  paper: Paper;
  index: number;
}

export const PaperCard = ({ paper, index }: PaperCardProps) => {
  const getPaperAreaInfo = (title: string) => {
    const titleLower = title.toLowerCase();
    let bestMatch = { area: RESEARCH_AREAS[0], score: 0 };

    for (const area of RESEARCH_AREAS) {
      let score = 0;
      
      for (const keyword of area.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (titleLower.includes(keywordLower)) {
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

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'arXiv': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      'Semantic Scholar': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800',
      'IEEE Xplore': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
    };
    return colors[source] || 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-300 dark:border-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const areaInfo = getPaperAreaInfo(paper.title);
  const AreaIcon = areaInfo.icon;

  return (
    <Card className="research-card group">
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Header */}
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

          {/* Summary */}
          {paper.summary && (
            <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Summary</span>
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

          {/* Footer */}
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
};