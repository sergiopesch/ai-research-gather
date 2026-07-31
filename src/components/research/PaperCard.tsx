import { ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { RESEARCH_AREAS } from '@/constants/research-areas';
import { usePaperActions } from '@/hooks/usePaperActions';
import { useToast } from '@/hooks/use-toast';
import { sanitizeText } from '@/utils/validation';
import type { Paper } from '@shared/research';

interface PaperCardProps {
  paper: Paper;
  index: number;
}

export const PaperCard = ({ paper, index }: PaperCardProps) => {
  const { selectPaper, isSelecting } = usePaperActions();
  const { toast } = useToast();

  const handleSelectPaper = async () => {
    if (!paper.id || paper.id.trim() === '') {
      toast({
        title: 'Unable to open paper',
        description: 'This paper is missing a valid identifier.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await selectPaper(paper);
    } catch {
      return;
    }
  };

  const getPaperArea = (title: string) => {
    const titleLower = title.toLowerCase();
    let bestMatch = { area: RESEARCH_AREAS[0], score: 0 };

    for (const area of RESEARCH_AREAS) {
      let score = 0;

      for (const keyword of area.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (titleLower.includes(keywordLower)) {
          score += ['robotics', 'computer vision', 'large language model', 'llm'].includes(keywordLower)
            ? 10
            : ['robot', 'vision', 'gpt'].includes(keywordLower)
              ? 5
              : 1;
        }
      }

      if (score > bestMatch.score) bestMatch = { area, score };
    }

    return bestMatch.area.label;
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const authors = paper.authors?.slice(0, 3).join(', ');
  const remainingAuthors = Math.max((paper.authors?.length ?? 0) - 3, 0);

  return (
    <article
      className="paper-result group border-b border-stone-200 py-7 sm:py-8"
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: 'backwards',
      }}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">
        <span className="text-[#7d5066]">{getPaperArea(paper.title)}</span>
        <span aria-hidden="true">·</span>
        <span>{paper.source}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={paper.published_date}>{formatDate(paper.published_date)}</time>
      </div>

      <h3 className="mt-3 max-w-2xl font-editorial text-2xl leading-tight tracking-[-0.02em] text-stone-950 sm:text-[1.7rem]">
        {sanitizeText(paper.title)}
      </h3>

      {authors && (
        <p className="mt-3 text-xs leading-5 text-stone-500">
          {authors}{remainingAuthors > 0 && ` +${remainingAuthors}`}
        </p>
      )}

      {paper.summary && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">
          {sanitizeText(paper.summary)}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSelectPaper}
          disabled={isSelecting}
          className="motion-control inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
        >
          {isSelecting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Opening
            </>
          ) : (
            <>
              Open studio
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
        </button>

        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2"
        >
          View paper
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
};
