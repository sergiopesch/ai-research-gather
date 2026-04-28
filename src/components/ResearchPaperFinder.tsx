import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { AreaSelector } from '@/components/research/AreaSelector';
import { PaperCard } from '@/components/research/PaperCard';
import { PaperGridSkeleton } from '@/components/research/PaperCardSkeleton';
import { RESEARCH_AREAS } from '@/constants/research-areas';
import { usePaperSearch } from '@/hooks/usePaperSearch';
import { useToast } from '@/hooks/use-toast';

const AREA_NAME_MAP: Record<string, string> = {
  robotics: 'Robotics',
  cv: 'Computer Vision',
  llm: 'Large Language Models',
};

const PAPER_COUNTS = [3, 6, 9, 12];

const ResearchPaperFinder = () => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(RESEARCH_AREAS.map((area) => area.id));
  const [paperCount, setPaperCount] = useState(6);
  const [hasSearched, setHasSearched] = useState(false);
  const { papers, loading, searchPapers, clearPapers } = usePaperSearch();
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const selectedKeywords = useMemo(
    () => selectedAreas.map((areaId) => AREA_NAME_MAP[areaId]).filter(Boolean),
    [selectedAreas],
  );

  const handleAreaToggle = useCallback((areaId: string) => {
    setSelectedAreas((current) =>
      current.includes(areaId)
        ? current.filter((id) => id !== areaId)
        : [...current, areaId],
    );
  }, []);

  const executeSearch = useCallback(async (limit: number) => {
    if (selectedAreas.length === 0) {
      toast({
        title: "Select an area",
        description: "Choose at least one research area.",
        variant: "destructive",
      });
      return;
    }

    setHasSearched(true);
    await searchPapers(selectedKeywords, limit);
  }, [searchPapers, selectedAreas.length, selectedKeywords, toast]);

  const handleSearch = useCallback(() => executeSearch(paperCount), [executeSearch, paperCount]);

  const handleLoadMore = useCallback(async () => {
    const nextCount = Math.min(paperCount + 6, 12);
    setPaperCount(nextCount);
    await executeSearch(nextCount);
  }, [executeSearch, paperCount]);

  const handleReset = useCallback(() => {
    clearPapers();
    setHasSearched(false);
  }, [clearPapers]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !loading) {
        handleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSearch, loading]);

  useEffect(() => {
    if (!loading && hasSearched) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasSearched, loading, papers.length]);

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <h1 className="text-display text-neutral-950">Research to script</h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-500 sm:text-base">
            Find recent arXiv papers and generate a grounded podcast script.
          </p>
        </div>

        <div className="comet-card p-4 sm:p-5">
          <AreaSelector selectedAreas={selectedAreas} onToggleArea={handleAreaToggle} />

          <div className="mt-5 flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500">Papers</span>
              <div className="flex rounded-lg bg-neutral-100 p-1">
                {PAPER_COUNTS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPaperCount(count)}
                    className={`min-w-10 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      paperCount === count
                        ? 'bg-white text-neutral-950 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={loading || selectedAreas.length === 0}
              className="comet-button inline-flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Find papers
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <section ref={resultsRef} className="mx-auto max-w-4xl scroll-mt-6 px-4 pb-16 sm:px-6">
        {loading && <PaperGridSkeleton count={paperCount} />}

        {!loading && papers.length > 0 && (
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-heading text-neutral-950">{papers.length} papers</h2>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-950"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-4">
              {papers.map((paper, index) => (
                <PaperCard
                  key={`${paper.doi || paper.url}-${index}`}
                  paper={paper}
                  index={index}
                />
              ))}
            </div>

            {papers.length >= paperCount && paperCount < 12 && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="comet-button-secondary inline-flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Load more
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && hasSearched && papers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">No papers found. Try a broader area.</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default ResearchPaperFinder;
