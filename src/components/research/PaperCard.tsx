import { Calendar, FileText, ExternalLink, Users, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RESEARCH_AREAS } from '@/constants/research-areas';
import { usePaperActions } from '@/hooks/usePaperActions';
import { useToast } from '@/hooks/use-toast';
import { sanitizeText } from '@/utils/validation';
import type { Paper } from '@/types/research';

interface PaperCardProps {
  paper: Paper;
  index: number;
}

export const PaperCard = ({ paper, index }: PaperCardProps) => {
  const { selectPaper, isSelecting, isPaperSelected } = usePaperActions();
  const { toast } = useToast();

  const handleSelectPaper = async () => {
    if (!paper.id || paper.id.trim() === '') {
      toast({
        title: "Error",
        description: "Invalid paper ID. Cannot select paper.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await selectPaper(paper.id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

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
  const isAlreadySelected = isPaperSelected(paper.id);

  return (
    <div className="brand-card hover-lift group overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-relaxed flex-1 group-hover:text-primary transition-colors">
              {sanitizeText(paper.title)}
            </h3>
            <div className="flex flex-wrap gap-3 flex-shrink-0">
              <Badge className={`${areaInfo.color} font-semibold`}>
                <AreaIcon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{areaInfo.label}</span>
                <span className="sm:hidden">{areaInfo.label.split(' ')[0]}</span>
              </Badge>
              <Badge variant="secondary" className="font-medium">
                {paper.source}
              </Badge>
            </div>
          </div>

          {/* Summary */}
          {paper.summary && (
            <div className="bg-gradient-subtle p-6 rounded-xl border border-border/50 shadow-soft">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">AI Summary</span>
                </div>
                <p className="text-base text-foreground leading-relaxed">
                  {sanitizeText(paper.summary)}
                </p>
                {paper.importance && (
                  <div className="pt-3 border-t border-border/30">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-primary">Research Impact:</span> {paper.importance}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pt-3 sm:pt-4 border-t border-border/50 gap-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  {formatDate(paper.published_date)}
                </span>
                {paper.doi && (
                  <span className="flex items-center gap-2">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{paper.doi}</span>
                  </span>
                )}
              </div>
              {paper.authors && paper.authors.length > 0 && (
                <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Authors:</span> 
                    <span className="ml-1">{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? '...' : ''}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleSelectPaper}
                disabled={isSelecting || isAlreadySelected}
                className={`brand-button flex items-center justify-center gap-3 text-base font-semibold px-6 py-3 h-12 rounded-xl transition-all duration-200 ${
                  isAlreadySelected ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
              >
                <Brain className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {isSelecting ? "Selecting..." : isAlreadySelected ? "Selected!" : "Create Episode"}
                </span>
                <span className="sm:hidden">
                  {isSelecting ? "Selecting..." : isAlreadySelected ? "Selected!" : "Select"}
                </span>
              </Button>
              
              <Button 
                variant="outline" 
                asChild 
                className="brand-button-secondary flex items-center justify-center gap-3 text-base font-semibold px-6 py-3 h-12 rounded-xl group-hover:border-primary group-hover:text-primary"
              >
                <a href={paper.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-5 h-5" />
                  <span className="hidden sm:inline">Read Full Paper</span>
                  <span className="sm:hidden">Read</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};