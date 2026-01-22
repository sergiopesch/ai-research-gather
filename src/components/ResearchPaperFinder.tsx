import { useState, useMemo, useCallback, useEffect } from 'react';
import { Play, Loader2, Search, Sparkles, RefreshCw, Filter } from 'lucide-react';
import { usePaperSearch } from '@/hooks/usePaperSearch';
import { RESEARCH_AREAS, TOPIC_ITEMS } from '@/constants/research-areas';
import { HeroSection } from '@/components/research/HeroSection';
import { AreaSelector } from '@/components/research/AreaSelector';
import { PaperCard } from '@/components/research/PaperCard';
import { EmptyState } from '@/components/research/EmptyState';
import { PaperGridSkeleton } from '@/components/research/PaperCardSkeleton';
import { useToast } from '@/hooks/use-toast';

const ResearchPaperFinder = () => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['ai', 'llm', 'cv']);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [paperCount, setPaperCount] = useState(6);
  const [hasSearched, setHasSearched] = useState(false);
  const { papers, loading, searchPapers, clearPapers } = usePaperSearch();
  const { toast } = useToast();

  // Memoize keywords calculation for better performance
  const selectedKeywords = useMemo(() => {
    // Get keywords from selected areas
    const areaKeywords = selectedAreas.flatMap(areaId => {
      const area = RESEARCH_AREAS.find(a => a.id === areaId);
      return area ? area.keywords : [];
    });

    // Get keywords from selected topics (more specific)
    const topicKeywords = selectedTopics.map(topicId => {
      const topic = TOPIC_ITEMS.find(t => t.id === topicId);
      return topic ? topic.label.toLowerCase() : '';
    }).filter(Boolean);

    // Combine and deduplicate
    const allKeywords = [...new Set([...areaKeywords, ...topicKeywords])];
    return allKeywords;
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

      <div className="relative -mt-16 z-10">
        <AreaSelector
          selectedAreas={selectedAreas}
          onToggleArea={handleAreaToggle}
          selectedTopics={selectedTopics}
          onToggleTopic={handleTopicToggle}
        />

        {/* Search controls section */}
        <div className="comet-section pb-8">
          <div className="comet-container">
            {/* Paper count selector */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>Papers to fetch:</span>
              </div>
              <div className="flex gap-2">
                {[3, 6, 9, 12].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPaperCount(count)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      paperCount === count
                        ? 'bg-primary text-primary-foreground scale-105'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
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
                className={`search-button comet-button text-lg px-12 py-5 inline-flex items-center gap-3 transition-all duration-300 ${
                  loading || selectedAreas.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 hover:shadow-large'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching arXiv...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Find Papers</span>
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary-foreground/20 rounded">
                      <span className="text-[10px]">⌘</span>
                      <span>↵</span>
                    </kbd>
                  </>
                )}
              </button>

              {selectedAreas.length === 0 && (
                <p className="text-caption mt-4 animate-fade-in">
                  Select research areas above to begin
                </p>
              )}

              {/* Quick reset button when papers are loaded */}
              {papers.length > 0 && !loading && (
                <button
                  onClick={handleClearAndReset}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
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
              <div className="text-center mb-12 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-sm font-medium text-primary">Searching...</span>
                </div>

                <h2 className="text-heading mb-4">
                  Discovering Research Papers
                </h2>
                <p className="text-body max-w-2xl mx-auto">
                  Fetching the latest papers from arXiv based on your interests...
                </p>
              </div>

              <PaperGridSkeleton count={paperCount} />
            </div>
          </div>
        )}

        {/* Results section with staggered animations */}
        {papers.length > 0 && !loading && (
          <div className="comet-section animate-fade-in">
            <div className="comet-container">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/30 mb-6 animate-bounce-in">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
                  <span className="text-sm font-medium text-foreground">
                    {papers.length} {papers.length === 1 ? 'Paper' : 'Papers'} Found
                  </span>
                </div>

                <h2 className="text-heading mb-4 animate-slide-up">
                  Research Papers
                </h2>
                <p className="text-body max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
                  Generate podcast scripts from these cutting-edge research papers
                </p>
              </div>

              <div className="space-y-8">
                {papers.map((paper, index) => (
                  <div
                    key={`${paper.doi || paper.url}-${index}`}
                    className="animate-slide-up"
                    style={{ animationDelay: `${(index + 1) * 100}ms`, animationFillMode: 'backwards' }}
                  >
                    <PaperCard paper={paper} index={index} />
                  </div>
                ))}
              </div>

              {/* Load more suggestion */}
              {papers.length >= paperCount && (
                <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '500ms' }}>
                  <p className="text-sm text-muted-foreground mb-4">
                    Want more papers? Increase the count and search again.
                  </p>
                  <button
                    onClick={() => {
                      setPaperCount(prev => Math.min(prev + 6, 12));
                      handleSearch();
                    }}
                    disabled={loading || paperCount >= 12}
                    className="comet-button-secondary inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Load More Papers
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
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-heading mb-2">No papers found</h3>
                <p className="text-body mb-6">
                  Try selecting different research areas or topics, or try again later as new papers are published daily.
                </p>
                <button
                  onClick={handleClearAndReset}
                  className="comet-button inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
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
