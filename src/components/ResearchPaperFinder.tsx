import { useState, useMemo, useCallback } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePaperSearch } from '@/hooks/usePaperSearch';
import { usePaperActions } from '@/hooks/usePaperActions';
import { RESEARCH_AREAS } from '@/constants/research-areas';
import { HeroSection } from '@/components/research/HeroSection';
import { AreaSelector } from '@/components/research/AreaSelector';
import { PaperCard } from '@/components/research/PaperCard';
import { EmptyState } from '@/components/research/EmptyState';
import { useToast } from '@/hooks/use-toast';

const ResearchPaperFinder = () => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['ai', 'robotics', 'cv']);
  const { papers, loading, searchPapers } = usePaperSearch();
  const { toast } = useToast();

  // Memoize keywords calculation for better performance
  const selectedKeywords = useMemo(() => {
    return selectedAreas.flatMap(areaId => {
      const area = RESEARCH_AREAS.find(a => a.id === areaId);
      return area ? area.keywords : [];
    });
  }, [selectedAreas]);

  const handleAreaToggle = useCallback((areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId) 
        : [...prev, areaId]
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

    await searchPapers(selectedKeywords, 6);
  }, [selectedAreas.length, selectedKeywords, searchPapers, toast]);

  // Memoize formatted date
  const formattedDate = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <div className="relative -mt-16 z-10">
        <AreaSelector 
          selectedAreas={selectedAreas} 
          onToggleArea={handleAreaToggle} 
        />

        {/* Clean search section */}
        <div className="comet-section pb-16">
          <div className="comet-container text-center">
            <button 
              onClick={handleSearch} 
              disabled={loading || selectedAreas.length === 0} 
              className={`comet-button text-lg px-12 py-5 ${
                loading || selectedAreas.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover-minimal'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-3" />
                  <span>Find Papers</span>
                </>
              )}
            </button>
            
            {selectedAreas.length === 0 && (
              <p className="text-caption mt-4">
                Select research areas above to begin
              </p>
            )}
          </div>
        </div>

        {/* Enhanced Results Section */}
        {papers.length > 0 && (
          <div className="premium-section">
            <div className="max-w-6xl mx-auto px-6 sm:px-8">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-glass border border-border/30 mb-6">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-foreground">Research Discovered</span>
                </div>
                
                <h2 className="text-heading mb-6">
                  Latest Research Papers
                </h2>
                <p className="text-body text-muted-foreground max-w-2xl mx-auto">
                  Transform these cutting-edge research papers into engaging podcast episodes with AI-powered insights
                </p>
              </div>

              <div className="space-y-8">
                {papers.map((paper, index) => (
                  <PaperCard key={`${paper.doi || paper.url}-${index}`} paper={paper} index={index} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {papers.length === 0 && !loading && <EmptyState />}
      </div>
    </div>
  );
};

export default ResearchPaperFinder;