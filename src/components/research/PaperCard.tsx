import { Calendar, FileText, ExternalLink, Users, Brain, ArrowRight } from 'lucide-react';
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
    <div className="modern-card p-8 group">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-2xl font-light text-foreground leading-relaxed mb-4 group-hover:text-primary transition-colors">
              {sanitizeText(paper.title)}
            </h3>
            <div className="flex items-center gap-3">
              <Badge className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                areaInfo.label === 'Artificial Intelligence' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                areaInfo.label === 'Robotics' ? 'bg-green-50 text-green-700 border-green-200' :
                'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                <AreaIcon className="w-4 h-4" />
                {areaInfo.label}
              </Badge>
              <span className="text-sm text-muted-foreground">{paper.source}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        {paper.summary && (
          <div className="bg-gradient-card p-6 rounded-2xl border border-border/50">
            <p className="text-base text-foreground leading-relaxed mb-4">
              {sanitizeText(paper.summary)}
            </p>
            {paper.importance && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Impact:</span> {paper.importance}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pt-4 border-t border-border/50 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(paper.published_date)}
              </span>
              {paper.doi && (
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-xs">{paper.doi}</span>
                </span>
              )}
            </div>
            {paper.authors && paper.authors.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? '...' : ''}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSelectPaper}
              disabled={isSelecting || isAlreadySelected}
              className={`modern-button px-6 py-3 rounded-full font-medium transition-all duration-300 inline-flex items-center gap-2 ${
                isAlreadySelected 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'hover:scale-105'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span>
                {isSelecting ? "Selecting..." : isAlreadySelected ? "Selected!" : "Create Episode"}
              </span>
              {!isSelecting && !isAlreadySelected && <ArrowRight className="w-4 h-4" />}
            </button>
            
            <a 
              href={paper.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="modern-button-secondary px-6 py-3 rounded-full font-medium transition-all duration-300 inline-flex items-center gap-2 hover:scale-105"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Read Paper</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};