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

        {/* Modern Search Button */}
        <div className="comet-section pb-16">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
            <button 
              onClick={handleSearch} 
              disabled={loading || selectedAreas.length === 0} 
              className={`group inline-flex items-center gap-4 px-12 py-5 rounded-full text-xl font-medium transition-all duration-300 ${
                loading || selectedAreas.length === 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-soft hover:shadow-large'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Finding papers...</span>
                </>
              ) : (
                <>
                  <div className="p-1 bg-primary-foreground/10 rounded-full">
                    <Play className="w-5 h-5" />
                  </div>
                  <span>Find Research Papers</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {papers.length > 0 && (
          <div className="comet-section py-16">
            <div className="max-w-6xl mx-auto px-6 sm:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-4">
                  Research Papers
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Transform these papers into engaging podcast episodes
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