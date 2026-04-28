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
      await selectPaper(paper);
    } catch {
      return;
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
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 font-medium text-neutral-600">
                <AreaIcon className="h-3 w-3" />
                {areaInfo.label}
              </span>
              <span>{paper.source}</span>
            </div>

            <h3 className="text-base font-medium leading-snug text-neutral-900 transition-colors group-hover:text-neutral-700">
              {sanitizeText(paper.title)}
            </h3>
          </div>

          <div
            className={`flex-shrink-0 rounded-lg p-2.5 transition-all duration-200 ${
              isAlreadySelected
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-400 group-hover:bg-neutral-200 group-hover:text-neutral-600'
            }`}
          >
            <AreaIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(paper.published_date)}
          </div>
          {paper.authors && paper.authors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>
                {paper.authors.slice(0, 2).join(', ')}
                {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
              </span>
            </div>
          )}
        </div>

        {paper.summary && (
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
            <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">
              {sanitizeText(paper.summary)}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSelectPaper}
            disabled={isSelecting || isAlreadySelected}
            className={`comet-button inline-flex flex-1 items-center justify-center gap-2 text-sm sm:flex-none ${
              isAlreadySelected
                ? 'bg-neutral-200 text-neutral-500'
                : isSelecting
                  ? 'opacity-70 cursor-wait'
                  : ''
            }`}
          >
            {isSelecting ? (
              <>
                <div className="loading-spinner h-3.5 w-3.5" />
                <span>Selecting...</span>
              </>
            ) : isAlreadySelected ? (
              <span>Selected</span>
            ) : (
              <>
                <span>Generate Script</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>

          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="comet-button-secondary inline-flex items-center gap-2 text-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View</span>
          </a>
        </div>
      </div>
    </div>
  );
};
