import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePaperSearch } from '@/hooks/usePaperSearch';
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

  const getSelectedKeywords = () => {
    return selectedAreas.flatMap(areaId => {
      const area = RESEARCH_AREAS.find(a => a.id === areaId);
      return area ? area.keywords : [];
    });
  };

  const handleAreaToggle = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId) 
        : [...prev, areaId]
    );
  };

  const handleSearch = async () => {
    if (selectedAreas.length === 0) {
      toast({
        title: "No research areas selected",
        description: "Please select at least one research area to search for papers.",
        variant: "destructive"
      });
      return;
    }

    const keywords = getSelectedKeywords();
    await searchPapers(keywords, 6);
  };

  const formatDate = (dateString: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-10">
        <AreaSelector 
          selectedAreas={selectedAreas} 
          onToggleArea={handleAreaToggle} 
        />

        {/* Search Button */}
        <div className="flex justify-center mb-12">
          <Button 
            onClick={handleSearch} 
            disabled={loading || selectedAreas.length === 0} 
            className="px-8 py-4 h-auto text-lg font-semibold bg-primary hover:bg-primary/90 shadow-medium transition-all duration-200 hover:scale-105"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Generating summary...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-3" />
                Discover Today's Papers
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {papers.length > 0 && (
          <div className="space-y-8 pb-16">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Latest Research Papers
                </h2>
                <p className="text-muted-foreground">
                  Papers from {formatDate(new Date().toISOString())}
                </p>
              </div>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                {papers.length} papers found
              </Badge>
            </div>

            <div className="grid gap-6">
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