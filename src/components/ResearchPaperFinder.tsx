import { useState, useMemo, useCallback, useEffect } from 'react';
import { Loader2, Search, RefreshCw } from 'lucide-react';
import { usePaperSearch } from '@/hooks/usePaperSearch';
import { TOPIC_ITEMS } from '@/constants/research-areas';
import { HeroSection } from '@/components/research/HeroSection';
import { AreaSelector } from '@/components/research/AreaSelector';
import { PaperCard } from '@/components/research/PaperCard';
import { EmptyState } from '@/components/research/EmptyState';
import { PaperGridSkeleton } from '@/components/research/PaperCardSkeleton';
import { useToast } from '@/hooks/use-toast';

const ResearchPaperFinder = () => {
  // Default to all 3 areas selected
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['robotics', 'cv', 'llm']);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [paperCount, setPaperCount] = useState(6);
  const [hasSearched, setHasSearched] = useState(false);
  const { papers, loading, searchPapers, clearPapers } = usePaperSearch();
  const { toast } = useToast();

  // Memoize keywords calculation - map frontend area IDs to backend-compatible area names
  const selectedKeywords = useMemo(() => {
    const areaNameMap: Record<string, string> = {
      'robotics': 'Robotics',
      'cv': 'Computer Vision',
      'llm': 'Large Language Models'
    };

    // Get the backend-compatible area names for selected areas
    const areaNames = selectedAreas.map(areaId => areaNameMap[areaId]).filter(Boolean);

    // Also include specific keywords from selected topics for additional filtering
    const topicKeywords = selectedTopics.map(topicId => {
      const topic = TOPIC_ITEMS.find(t => t.id === topicId);
      return topic ? topic.label.toLowerCase() : '';
    }).filter(Boolean);

    // Combine area names (for backend mapping) with topic keywords (for filtering)
    return [...areaNames, ...topicKeywords];
  }, [selectedAreas, selectedTopics]);

  const handleAreaToggle = useCallback((areaId: string) => {
    setSelectedAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  }, []);

  const handleTopicToggle = useCallback((topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  }, []);

  const handleSearch = useCallback(async () => {
    if (selectedAreas.length === 0) {
      toast({
        title: "No research areas selected",
        description: "Please select at least one research area to search for papers.",
        variant: "destructive"
      });
      return;
    }

    setHasSearched(true);
    await searchPapers(selectedKeywords, paperCount);
  }, [selectedAreas.length, selectedKeywords, searchPapers, paperCount, toast]);

  const handleClearAndReset = useCallback(() => {
    clearPapers();
    setHasSearched(false);
  }, [clearPapers]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading) {
        handleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSearch, loading]);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <div className="relative -mt-8 z-10">
        <AreaSelector
          selectedAreas={selectedAreas}
          onToggleArea={handleAreaToggle}
          selectedTopics={selectedTopics}
          onToggleTopic={handleTopicToggle}
        />

        {/* Search controls section */}
        <div className="py-8">
          <div className="comet-container">
            {/* Paper count selector */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in">
              <span className="text-sm text-neutral-500">Papers:</span>
              <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
                {[3, 6, 9, 12].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPaperCount(count)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                      paperCount === count
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Main search button */}
            <div className="text-center">
              <button
                onClick={handleSearch}
                disabled={loading || selectedAreas.length === 0}
                className={`comet-button text-sm px-8 py-3 inline-flex items-center gap-2 transition-all duration-200 ${
                  loading || selectedAreas.length === 0
                    ? 'opacity-40 cursor-not-allowed'
                    : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Find Papers</span>
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] bg-white/20 rounded ml-1">
                      <span>⌘</span>
                      <span>↵</span>
                    </kbd>
                  </>
                )}
              </button>

              {selectedAreas.length === 0 && (
                <p className="text-xs text-neutral-400 mt-3 animate-fade-in">
                  Select research areas above to begin
                </p>
              )}

              {/* Quick reset button when papers are loaded */}
              {papers.length > 0 && !loading && (
                <button
                  onClick={handleClearAndReset}
                  className="mt-3 text-xs text-neutral-400 hover:text-neutral-600 inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Clear and search again
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="comet-section">
            <div className="comet-container">
              <div className="text-center mb-8 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 mb-4">
                  <Loader2 className="w-3.5 h-3.5 text-neutral-500 animate-spin" />
                  <span className="text-xs font-medium text-neutral-600">Searching arXiv...</span>
                </div>

                <h2 className="text-heading text-neutral-900 mb-2">
                  Discovering Papers
                </h2>
                <p className="text-sm text-neutral-500">
                  Fetching the latest papers based on your interests...
                </p>
              </div>

              <PaperGridSkeleton count={paperCount} />
            </div>
          </div>
        )}

        {/* Results section */}
        {papers.length > 0 && !loading && (
          <div className="comet-section animate-fade-in">
            <div className="comet-container">
              <div className="text-center mb-8">
                <span className="text-xs font-medium text-neutral-500 mb-3 block">
                  {papers.length} {papers.length === 1 ? 'paper' : 'papers'} found
                </span>

                <h2 className="text-heading text-neutral-900 mb-2">
                  Research Papers
                </h2>
                <p className="text-sm text-neutral-500">
                  Generate podcast scripts from these papers
                </p>
              </div>

              <div className="space-y-4">
                {papers.map((paper, index) => (
                  <div
                    key={`${paper.doi || paper.url}-${index}`}
                    className="animate-slide-up"
                    style={{ animationDelay: `${(index + 1) * 80}ms`, animationFillMode: 'backwards' }}
                  >
                    <PaperCard paper={paper} index={index} />
                  </div>
                ))}
              </div>

              {/* Load more suggestion */}
              {papers.length >= paperCount && (
                <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
                  <p className="text-xs text-neutral-400 mb-3">
                    Want more papers? Increase the count and search again.
                  </p>
                  <button
                    onClick={() => {
                      setPaperCount(prev => Math.min(prev + 6, 12));
                      handleSearch();
                    }}
                    disabled={loading || paperCount >= 12}
                    className="comet-button-secondary inline-flex items-center gap-2 text-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {papers.length === 0 && !loading && hasSearched && (
          <div className="comet-section animate-fade-in">
            <div className="comet-container text-center">
              <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <Search className="w-5 h-5 text-neutral-400" />
                </div>
                <h3 className="text-base font-medium text-neutral-900 mb-2">No papers found</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Try selecting different research areas or topics.
                </p>
                <button
                  onClick={handleClearAndReset}
                  className="comet-button inline-flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Initial empty state */}
        {papers.length === 0 && !loading && !hasSearched && <EmptyState />}
      </div>
    </div>
  );
};

export default ResearchPaperFinder;
