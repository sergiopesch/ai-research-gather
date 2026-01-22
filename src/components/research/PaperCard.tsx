import { useState } from 'react';
import { Calendar, ExternalLink, Users, ArrowRight } from 'lucide-react';
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
          if (['robotics', 'computer vision', 'large language model', 'llm'].includes(keywordLower)) {
            score += 10;
          } else if (['robot', 'vision', 'gpt'].includes(keywordLower)) {
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
      id: bestMatch.area.id,
      label: bestMatch.area.label,
      icon: bestMatch.area.icon
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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
    >
      <div className="space-y-5">
        {/* Header with area badge and icon */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Area badge */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600">
                <AreaIcon className="w-3 h-3" />
                {areaInfo.label}
              </span>
              <span className="text-xs text-neutral-400">
                {paper.source}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base font-medium text-neutral-900 leading-snug group-hover:text-neutral-700 transition-colors">
              {sanitizeText(paper.title)}
            </h3>
          </div>

          {/* Icon indicator */}
          <div
            className={`flex-shrink-0 p-2.5 rounded-lg transition-all duration-200 ${
              isAlreadySelected
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-400 group-hover:bg-neutral-200 group-hover:text-neutral-600'
            }`}
          >
            <AreaIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(paper.published_date)}
          </div>
          {paper.authors && paper.authors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>
                {paper.authors.slice(0, 2).join(', ')}
                {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
              </span>
            </div>
          )}
        </div>

        {/* Summary section */}
        {paper.summary && (
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
            <p
              className={`text-sm text-neutral-600 leading-relaxed ${
                !showFullSummary ? 'line-clamp-2' : ''
              }`}
            >
              {sanitizeText(paper.summary)}
            </p>
            {paper.summary.length > 150 && (
              <button
                onClick={() => setShowFullSummary(!showFullSummary)}
                className="text-xs font-medium mt-2 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                {showFullSummary ? 'Show less' : 'Read more'}
              </button>
            )}
            {paper.importance && (
              <div className="flex items-center gap-2 pt-3 mt-3 border-t border-neutral-200">
                <span className="text-xs text-neutral-400">Impact:</span>
                <span className="text-xs text-neutral-600">{paper.importance}</span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSelectPaper}
            disabled={isSelecting || isAlreadySelected}
            className={`comet-button flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-sm ${
              isAlreadySelected
                ? 'bg-neutral-200 text-neutral-500'
                : isSelecting
                  ? 'opacity-70 cursor-wait'
                  : ''
            }`}
          >
            {isSelecting ? (
              <>
                <div className="loading-spinner w-3.5 h-3.5" />
                <span>Processing...</span>
              </>
            ) : isAlreadySelected ? (
              <span>Script Generated</span>
            ) : (
              <>
                <span>Generate Script</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="comet-button-secondary inline-flex items-center gap-2 text-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View</span>
          </a>
        </div>
      </div>
    </div>
  );
};
