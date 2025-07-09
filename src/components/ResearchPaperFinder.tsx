import { useState, useMemo, useCallback } from 'react';
import { Play, Loader2, ArrowRight } from 'lucide-react';
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
import { Link } from 'react-router-dom';

const ResearchPaperFinder = () => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['ai', 'robotics', 'cv']);
  const { papers, loading, searchPapers } = usePaperSearch();
  const { hasSelectedPaper } = usePaperActions();
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12 relative z-10">
        <AreaSelector 
          selectedAreas={selectedAreas} 
          onToggleArea={handleAreaToggle} 
        />

        {/* Processing Hub Access */}
        {hasSelectedPaper && (
          <div className="flex justify-center mb-6">
            <Button variant="outline" asChild className="px-6 py-3 h-auto text-base font-medium">
              <Link to="/processing">
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Processing Hub
              </Link>
            </Button>
          </div>
        )}

        {/* Search Button */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <Button 
            onClick={handleSearch} 
            disabled={loading || selectedAreas.length === 0} 
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 h-auto text-base sm:text-lg font-semibold bg-primary hover:bg-primary/90 shadow-medium transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin" />
                <span className="hidden sm:inline">Generating summary...</span>
                <span className="sm:hidden">Loading...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                <span className="hidden sm:inline">Discover Today's Papers</span>
                <span className="sm:hidden">Discover Papers</span>
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {papers.length > 0 && (
          <div className="space-y-6 sm:space-y-8 pb-12 sm:pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Latest Research Papers
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Papers from {formattedDate}
                </p>
              </div>
              <Badge variant="secondary" className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium w-fit">
                {papers.length} papers found
              </Badge>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {papers.map((paper, index) => (
                <PaperCard key={`${paper.doi || paper.url}-${index}`} paper={paper} index={index} />
              ))}
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