import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, FileSearch, Loader2, Search, X } from 'lucide-react';
import { AreaSelector } from '@/components/research/AreaSelector';
import { PaperCard } from '@/components/research/PaperCard';
import { PaperGridSkeleton } from '@/components/research/PaperCardSkeleton';
import { RESEARCH_AREAS } from '@/constants/research-areas';
import { usePaperSearch } from '@/hooks/usePaperSearch';
import { useToast } from '@/hooks/use-toast';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';

const AREA_NAME_MAP: Record<string, string> = {
  robotics: 'Robotics',
  cv: 'Computer Vision',
  llm: 'Large Language Models',
};

const PAPER_COUNTS = [3, 6, 9, 12];

const normalizeTopic = (value: string) => value.trim().replace(/\s+/g, ' ');

const ResearchPaperFinder = () => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(RESEARCH_AREAS.map((area) => area.id));
  const [topicInput, setTopicInput] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [paperCount, setPaperCount] = useState(6);
  const [hasSearched, setHasSearched] = useState(false);
  const { papers, loading, searchPapers, clearPapers } = usePaperSearch();
  const { toast } = useToast();
  const resultsRef = useRef<HTMLElement | null>(null);

  const selectedKeywords = useMemo(() => {
    const areaKeywords = selectedAreas.map((areaId) => AREA_NAME_MAP[areaId]).filter(Boolean);
    const cleanDraft = normalizeTopic(topicInput);
    const topics = cleanDraft && !selectedTopics.some((topic) => topic.toLowerCase() === cleanDraft.toLowerCase())
      ? [...selectedTopics, cleanDraft]
      : selectedTopics;

    return [...areaKeywords, ...topics];
  }, [selectedAreas, selectedTopics, topicInput]);

  const hasSearchCriteria = selectedKeywords.length > 0;

  const handleAreaToggle = useCallback((areaId: string) => {
    setSelectedAreas((current) =>
      current.includes(areaId)
        ? current.filter((id) => id !== areaId)
        : [...current, areaId],
    );
  }, []);

  const addTopic = useCallback((value: string) => {
    const cleanTopic = normalizeTopic(value);
    if (!cleanTopic) return;

    setSelectedTopics((current) => (
      current.some((topic) => topic.toLowerCase() === cleanTopic.toLowerCase())
        ? current
        : [...current, cleanTopic]
    ));
    setTopicInput('');
  }, []);

  const handleTopicKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || !normalizeTopic(topicInput)) return;

    event.preventDefault();
    addTopic(topicInput);
  };

  const handleRemoveTopic = useCallback((topicToRemove: string) => {
    setSelectedTopics((current) => current.filter((topic) => topic !== topicToRemove));
  }, []);

  const executeSearch = useCallback(async (limit: number) => {
    if (!hasSearchCriteria) {
      toast({
        title: 'Add a starting point',
        description: 'Choose an area or enter a topic to search.',
        variant: 'destructive',
      });
      return;
    }

    setHasSearched(true);
    await searchPapers(selectedKeywords, limit);
  }, [hasSearchCriteria, searchPapers, selectedKeywords, toast]);

  const handleSearch = useCallback(() => executeSearch(paperCount), [executeSearch, paperCount]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (normalizeTopic(topicInput)) addTopic(topicInput);
    void handleSearch();
  };

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
    if (!loading && hasSearched) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasSearched, loading, papers.length]);

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-stone-950">
      <header className="border-b border-stone-200 bg-[#fbfaf7]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7d5066]">
            Research notebook
          </span>
          <span className="text-xs text-stone-500">arXiv · last 14 days</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="border-b border-stone-200 px-5 py-9 sm:px-8 lg:border-b-0 lg:border-r lg:py-12">
          <div className="lg:sticky lg:top-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7d5066]">
              Discover
            </p>
            <h1 className="mt-3 max-w-xs font-editorial text-5xl leading-[0.96] tracking-[-0.035em] sm:text-6xl lg:text-5xl">
              Find a paper
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-stone-600">
              Search recent research, then turn the paper you choose into a grounded conversation.
            </p>

            <form onSubmit={handleSubmit} className="mt-9 space-y-7">
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-4">
                  <label htmlFor="research-topic" className="text-sm font-medium text-stone-900">
                    Topic
                  </label>
                  <span className="text-xs text-stone-400">Enter to add</span>
                </div>
                <input
                  id="research-topic"
                  type="search"
                  value={topicInput}
                  onChange={(event) => setTopicInput(event.target.value)}
                  onKeyDown={handleTopicKeyDown}
                  maxLength={100}
                  autoComplete="off"
                  placeholder="e.g. embodied AI safety"
                  className="min-h-12 w-full rounded-md border border-stone-300 bg-white px-3.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
                />
                {selectedTopics.length > 0 && (
                  <div className="mt-2 grid gap-2" role="list" aria-label="Selected topics">
                    {selectedTopics.map((topic) => (
                      <div
                        key={topic.toLowerCase()}
                        role="listitem"
                        className="topic-selection flex min-h-12 items-center gap-3 rounded-md border border-stone-900 bg-white px-3.5 text-sm text-stone-950"
                      >
                        <Search className="h-4 w-4 shrink-0 text-[#7d5066]" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{topic}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(topic)}
                          aria-label={`Remove topic ${topic}`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <span className="sr-only" aria-live="polite">
                  {selectedTopics.length > 0 ? `${selectedTopics.length} ${selectedTopics.length === 1 ? 'topic' : 'topics'} selected` : ''}
                </span>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-stone-900">Research areas</legend>
                <AreaSelector selectedAreas={selectedAreas} onToggleArea={handleAreaToggle} />
              </fieldset>

              <div className="border-t border-stone-200 pt-6">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="paper-count" className="text-sm text-stone-600">
                    Results
                  </label>
                  <select
                    id="paper-count"
                    value={paperCount}
                    onChange={(event) => setPaperCount(Number(event.target.value))}
                    className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
                  >
                    {PAPER_COUNTS.map((count) => (
                      <option key={count} value={count}>{count} papers</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading || !hasSearchCriteria}
                  className="motion-control mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Searching
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" aria-hidden="true" />
                      Find papers
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </aside>

        <section ref={resultsRef} className="scroll-mt-6 px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-3xl">
            {!loading && !hasSearched && (
              <div className="research-state flex min-h-[420px] flex-col items-center justify-center text-center lg:min-h-[calc(100vh-10rem)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500">
                  <FileSearch className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-7 font-editorial text-3xl tracking-[-0.02em] text-stone-900">
                  What are you researching?
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-stone-500">
                  Choose an area or type a topic. Recent papers will appear here.
                </p>
              </div>
            )}

            {loading && (
              <div className="research-state" aria-live="polite" aria-busy="true">
                <div className="mb-8 border-b border-stone-200 pb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7d5066]">
                    Searching arXiv
                  </p>
                  <h2 className="mt-2 font-editorial text-3xl tracking-[-0.02em]">Finding recent papers</h2>
                </div>
                <PaperGridSkeleton count={paperCount} />
              </div>
            )}

            {!loading && papers.length > 0 && (
              <div className="research-state">
                <div className="mb-1 flex items-end justify-between gap-6 border-b border-stone-200 pb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7d5066]">
                      Search results
                    </p>
                    <h2 className="mt-2 font-editorial text-3xl tracking-[-0.02em]">
                      {papers.length} {papers.length === 1 ? 'paper' : 'papers'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Clear
                  </button>
                </div>

                <div>
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
                      className="inline-flex min-h-11 items-center gap-2 rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2"
                    >
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      Show more
                    </button>
                  </div>
                )}
              </div>
            )}

            {!loading && hasSearched && papers.length === 0 && (
              <div className="research-state flex min-h-[420px] flex-col items-center justify-center text-center" role="status">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500">
                  <FileSearch className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-7 font-editorial text-3xl tracking-[-0.02em] text-stone-900">
                  No close matches
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500">
                  Try a broader topic or include another research area.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ResearchPaperFinder;
