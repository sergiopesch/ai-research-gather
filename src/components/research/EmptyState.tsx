import { Search, Sparkles, ArrowUp } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="comet-section text-center animate-fade-in">
      <div className="max-w-md mx-auto space-y-8">
        {/* Animated illustration */}
        <div className="relative">
          <div className="p-8 bg-muted/30 rounded-full w-fit mx-auto animate-float">
            <Search className="w-12 h-12 text-muted-foreground" />
          </div>
          {/* Orbiting sparkle */}
          <div className="absolute top-0 right-1/4 animate-spin-slow">
            <Sparkles className="w-5 h-5 text-primary/50" />
          </div>
        </div>

        {/* Clean messaging */}
        <div className="space-y-4">
          <h3 className="text-heading animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            Ready to explore?
          </h3>
          <p className="text-body animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            Select your research interests above and discover the latest papers from arXiv
          </p>
        </div>

        {/* Helpful hint */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
          <ArrowUp className="w-4 h-4 animate-bounce" />
          <span>Choose topics and click "Find Papers"</span>
        </div>
      </div>
    </div>
  );
};
