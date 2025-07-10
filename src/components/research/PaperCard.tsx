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
    <div className="research-card group hover-scale">
      <div className="space-y-6">
        {/* Enhanced header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-heading text-foreground leading-tight group-hover:text-primary transition-colors flex-1">
              {sanitizeText(paper.title)}
            </h3>
            <div className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${
              isAlreadySelected 
                ? 'bg-primary/10 text-primary' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <AreaIcon className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
              areaInfo.label === 'Artificial Intelligence' ? 'bg-gradient-ai border-ai-border text-ai-primary' :
              areaInfo.label === 'Robotics' ? 'bg-gradient-robotics border-robotics-border text-robotics-primary' :
              'bg-gradient-cv border-cv-border text-cv-primary'
            }`}>
              <AreaIcon className="w-3.5 h-3.5" />
              {areaInfo.label}
            </div>
            <span className="text-caption px-3 py-1 bg-muted rounded-full">{paper.source}</span>
          </div>
        </div>

        {/* Enhanced summary */}
        {paper.summary && (
          <div className="bg-gradient-card p-6 rounded-xl border border-border/50 space-y-3">
            <p className="text-body text-foreground leading-relaxed">
              {sanitizeText(paper.summary)}
            </p>
            {paper.importance && (
              <div className="pt-3 border-t border-border/30">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">Research Impact:</span>{' '}
                  <span className="text-muted-foreground">{paper.importance}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Enhanced metadata */}
        <div className="space-y-4">
          <div className="flex items-center gap-6 text-caption">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(paper.published_date)}</span>
            </div>
            {paper.doi && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="truncate max-w-xs font-mono text-xs">{paper.doi}</span>
              </div>
            )}
          </div>
          
          {paper.authors && paper.authors.length > 0 && (
            <div className="flex items-start gap-2 text-caption">
              <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">
                {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ` and ${paper.authors.length - 3} others` : ''}
              </span>
            </div>
          )}
        </div>
        
        {/* Enhanced action buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-border/30">
          <button 
            onClick={handleSelectPaper}
            disabled={isSelecting || isAlreadySelected}
            className={`premium-button px-6 py-3 rounded-full text-sm hover-scale inline-flex items-center gap-2 flex-1 sm:flex-none ${
              isAlreadySelected 
                ? 'bg-green-600 text-white hover:bg-green-700 border-green-600' 
                : ''
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>
              {isSelecting ? "Processing..." : isAlreadySelected ? "Episode Created!" : "Create Episode"}
            </span>
          </button>
          
          <a 
            href={paper.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="premium-button-outline px-6 py-3 rounded-full text-sm hover-scale inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Paper</span>
          </a>
        </div>
      </div>
    </div>
  );
};