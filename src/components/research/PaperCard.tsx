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
    <div className="paper-card hover-minimal">
      <div className="space-y-6">
        {/* Clean header */}
        <div className="flex items-start justify-between gap-6">
          <h3 className="text-heading text-foreground leading-tight group-hover:text-primary transition-colors flex-1">
            {sanitizeText(paper.title)}
          </h3>
          <div className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${
            isAlreadySelected 
              ? 'bg-primary/10 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <AreaIcon className="w-5 h-5" />
          </div>
        </div>
        
        {/* Minimal metadata */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            areaInfo.label === 'Artificial Intelligence' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            areaInfo.label === 'Robotics' ? 'bg-green-50 text-green-700 border border-green-200' :
            'bg-purple-50 text-purple-700 border border-purple-200'
          }`}>
            <AreaIcon className="w-3.5 h-3.5" />
            {areaInfo.label}
          </div>
          <span className="text-caption">{paper.source}</span>
          <span className="text-caption">{formatDate(paper.published_date)}</span>
        </div>

        {/* Clean summary */}
        {paper.summary && (
          <div className="bg-muted/30 p-6 rounded-xl space-y-3">
            <p className="text-body text-foreground leading-relaxed">
              {sanitizeText(paper.summary)}
            </p>
            {paper.importance && (
              <p className="text-caption">
                <span className="font-medium text-foreground">Impact:</span> {paper.importance}
              </p>
            )}
          </div>
        )}

        {/* Author info if available */}
        {paper.authors && paper.authors.length > 0 && (
          <div className="flex items-center gap-2 text-caption">
            <Users className="w-4 h-4" />
            <span>
              {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ` and ${paper.authors.length - 3} others` : ''}
            </span>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex items-center gap-4 pt-4">
          <button 
            onClick={handleSelectPaper}
            disabled={isSelecting || isAlreadySelected}
            className={`comet-button flex-1 sm:flex-none inline-flex items-center gap-2 ${
              isAlreadySelected 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : ''
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>
              {isSelecting ? "Processing..." : isAlreadySelected ? "Generated!" : "Generate Script"}
            </span>
          </button>
          
          <a 
            href={paper.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="comet-button-secondary inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Paper</span>
          </a>
        </div>
      </div>
    </div>
  );
};