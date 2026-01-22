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

  // Memoize keywords calculation - FIXED: Send area labels that backend recognizes
  const selectedKeywords = useMemo(() => {
    // Map frontend area IDs to backend-compatible area names
    const areaNameMap: Record<string, string> = {
      'ai': 'Artificial Intelligence',
      'robotics': 'Robotics',
      'cv': 'Computer Vision',
      'nlp': 'Natural Language Processing',
      'llm': 'Large Language Models',
      'multimodal': 'Multimodal AI',
      'agents': 'AI Agents',
      'mlops': 'MLOps',
      'safety': 'AI Safety',
      'rl': 'Reinforcement Learning'
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

      <div className="relative -mt-16 z-10">
        <AreaSelector
          selectedAreas={selectedAreas}
          onToggleArea={handleAreaToggle}
          selectedTopics={selectedTopics}
          onToggleTopic={handleTopicToggle}
        />

        {/* Search controls section */}
        <div className="py-12">
          <div className="comet-container">
            {/* Paper count selector */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <Filter className="w-4 h-4" />
                <span>Papers to fetch:</span>
              </div>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                {[3, 6, 9, 12].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPaperCount(count)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      paperCount === count
                        ? 'bg-white text-indigo-600 shadow-soft'
                        : 'text-slate-500 hover:text-slate-700'
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
                className={`search-button comet-button text-lg px-14 py-5 inline-flex items-center gap-3 transition-all duration-300 ${
                  loading || selectedAreas.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-[1.03]'
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
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white/20 rounded-md ml-1">
                      <span className="text-[10px]">⌘</span>
                      <span>↵</span>
                    </kbd>
                  </>
                )}
              </button>

              {selectedAreas.length === 0 && (
                <p className="text-sm text-slate-500 mt-4 animate-fade-in">
                  Select research areas above to begin
                </p>
              )}

              {/* Quick reset button when papers are loaded */}
              {papers.length > 0 && !loading && (
                <button
                  onClick={handleClearAndReset}
                  className="mt-4 text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-2 transition-colors"
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
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-sm font-semibold text-indigo-600">Searching arXiv...</span>
                </div>

                <h2 className="text-heading text-slate-900 mb-4">
                  Discovering Research Papers
                </h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
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
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-green-50 border border-green-100 mb-6 animate-bounce-in">
                  <Sparkles className="w-4 h-4 text-green-600 animate-pulse-glow" />
                  <span className="text-sm font-semibold text-green-700">
                    {papers.length} {papers.length === 1 ? 'Paper' : 'Papers'} Found
                  </span>
                </div>

                <h2 className="text-heading text-slate-900 mb-4 animate-slide-up">
                  Research Papers
                </h2>
                <p className="text-slate-600 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
                  Generate podcast scripts from these cutting-edge research papers
                </p>
              </div>

              <div className="space-y-6">
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
                  <p className="text-sm text-slate-500 mb-4">
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
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">No papers found</h3>
                <p className="text-slate-600 mb-6">
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
