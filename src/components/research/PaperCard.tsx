import { useState } from 'react';
import { Calendar, FileText, ExternalLink, Users, Brain, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
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
  const [isHovered, setIsHovered] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);

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
          if (['artificial intelligence', 'machine learning', 'deep learning', 'robotics', 'computer vision', 'large language model'].includes(keywordLower)) {
            score += 10;
          } else if (['ai', 'ml', 'cv', 'robot', 'vision', 'llm', 'nlp'].includes(keywordLower)) {
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
    <div
      className="paper-card card-interactive group"
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'backwards'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className="relative space-y-6">
        {/* Header with animated icon */}
        <div className="flex items-start justify-between gap-6">
          <h3 className="text-heading text-foreground leading-tight group-hover:text-primary transition-colors duration-300 flex-1">
            {sanitizeText(paper.title)}
          </h3>
          <div
            className={`flex-shrink-0 p-3 rounded-xl transition-all duration-500 transform ${
              isAlreadySelected
                ? 'bg-primary text-primary-foreground scale-110 rotate-3'
                : isHovered
                  ? 'bg-primary/10 text-primary scale-105 -rotate-3'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            <AreaIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Animated metadata pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              isHovered
                ? 'bg-primary text-primary-foreground scale-105'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <AreaIcon className="w-3.5 h-3.5" />
            {areaInfo.label}
          </div>
          <div className="flex items-center gap-1.5 text-caption">
            <BookOpen className="w-3.5 h-3.5" />
            {paper.source}
          </div>
          <div className="flex items-center gap-1.5 text-caption">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(paper.published_date)}
          </div>
        </div>

        {/* Enhanced summary section with expand/collapse */}
        {paper.summary && (
          <div
            className={`bg-muted/50 p-5 rounded-xl space-y-3 transition-all duration-300 ${
              isHovered ? 'bg-muted/70 shadow-inner' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              <Sparkles className={`w-4 h-4 mt-1 flex-shrink-0 transition-all duration-300 ${
                isHovered ? 'text-primary animate-pulse-glow' : 'text-muted-foreground'
              }`} />
              <div className="flex-1">
                <p
                  className={`text-body text-foreground leading-relaxed transition-all duration-300 ${
                    !showFullSummary ? 'line-clamp-3' : ''
                  }`}
                >
                  {sanitizeText(paper.summary)}
                </p>
                {paper.summary.length > 200 && (
                  <button
                    onClick={() => setShowFullSummary(!showFullSummary)}
                    className="text-sm text-primary hover:text-primary/80 font-medium mt-2 transition-colors"
                  >
                    {showFullSummary ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
            {paper.importance && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground">Impact:</span>
                <span className="text-xs text-foreground">{paper.importance}</span>
              </div>
            )}
          </div>
        )}

        {/* Authors with animation */}
        {paper.authors && paper.authors.length > 0 && (
          <div
            className={`flex items-center gap-2 text-caption transition-all duration-300 ${
              isHovered ? 'translate-x-1' : ''
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              {paper.authors.slice(0, 3).join(', ')}
              {paper.authors.length > 3 && ` and ${paper.authors.length - 3} others`}
            </span>
          </div>
        )}

        {/* Enhanced action buttons */}
        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={handleSelectPaper}
            disabled={isSelecting || isAlreadySelected}
            className={`search-button comet-button flex-1 sm:flex-none inline-flex items-center justify-center gap-2 transition-all duration-300 ${
              isAlreadySelected
                ? 'bg-primary text-primary-foreground'
                : isSelecting
                  ? 'opacity-70 cursor-wait'
                  : 'hover:gap-3'
            } ${isHovered && !isAlreadySelected && !isSelecting ? 'shadow-medium' : ''}`}
          >
            {isSelecting ? (
              <>
                <div className="loading-spinner w-4 h-4" />
                <span>Processing...</span>
              </>
            ) : isAlreadySelected ? (
              <>
                <Sparkles className="w-4 h-4 animate-pulse-glow" />
                <span>Generated!</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Generate Script</span>
                <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
              </>
            )}
          </button>

          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`comet-button-secondary inline-flex items-center gap-2 transition-all duration-300 ${
              isHovered ? 'shadow-soft' : ''
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Paper</span>
          </a>
        </div>
      </div>
    </div>
  );
};
