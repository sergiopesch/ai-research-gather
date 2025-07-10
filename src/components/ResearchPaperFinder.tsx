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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12 relative z-10">
        <AreaSelector 
          selectedAreas={selectedAreas} 
          onToggleArea={handleAreaToggle} 
        />


        {/* Search Button */}
        <div className="flex justify-center mb-12 sm:mb-16">
          <Button 
            onClick={handleSearch} 
            disabled={loading || selectedAreas.length === 0} 
            className={`w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 h-auto text-xl sm:text-2xl font-bold rounded-xl transition-all duration-200 border-2 shadow-lg ${
              loading || selectedAreas.length === 0
                ? 'bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed opacity-60'
                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 hover:shadow-xl hover:scale-105 active:scale-100'
            }`}
            size="lg"
            style={{ 
              backgroundColor: loading || selectedAreas.length === 0 ? '#d1d5db' : '#2563eb',
              color: loading || selectedAreas.length === 0 ? '#6b7280' : '#ffffff',
              borderColor: loading || selectedAreas.length === 0 ? '#9ca3af' : '#2563eb'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 mr-3 sm:mr-4 animate-spin" />
                <span className="hidden sm:inline font-bold">Finding papers...</span>
                <span className="sm:hidden font-bold">Loading...</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6 sm:w-7 sm:h-7 mr-3 sm:mr-4" />
                <span className="hidden sm:inline font-bold">Find Research Papers</span>
                <span className="sm:hidden font-bold">Find Papers</span>
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {papers.length > 0 && (
          <div className="space-y-8 sm:space-y-12 pb-16 sm:pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Research Papers
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Select papers to create podcast episodes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium rounded-full bg-gradient-subtle">
                  {papers.length} papers found
                </Badge>
              </div>
            </div>

            <div className="grid gap-6 sm:gap-8">
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