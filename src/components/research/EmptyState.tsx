import { Search, Sparkles } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="premium-section text-center">
      <div className="max-w-lg mx-auto px-6">
        {/* Enhanced empty state illustration */}
        <div className="relative mb-8">
          <div className="p-6 bg-gradient-premium rounded-2xl w-fit mx-auto mb-6 shadow-brand">
            <Search className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2">
            <div className="p-2 bg-gradient-ai rounded-full shadow-md">
              <Sparkles className="w-4 h-4 text-ai-primary" />
            </div>
          </div>
        </div>
        
        {/* Enhanced content */}
        <h3 className="text-heading mb-4">
          Ready to Discover Research?
        </h3>
        <p className="text-body text-muted-foreground leading-relaxed mb-6">
          Select your research areas above and click the search button to find today's most impactful papers with AI-powered insights.
        </p>
        
        {/* Helpful hint */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span>Choose multiple areas for broader discovery</span>
        </div>
      </div>
    </div>
  );
};