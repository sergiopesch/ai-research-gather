import { Search } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="comet-section text-center">
      <div className="max-w-md mx-auto space-y-6">
        {/* Minimal illustration */}
        <div className="p-8 bg-muted/20 rounded-full w-fit mx-auto">
          <Search className="w-12 h-12 text-muted-foreground" />
        </div>
        
        {/* Clean messaging */}
        <div className="space-y-3">
          <h3 className="text-heading">
            Ready to explore?
          </h3>
          <p className="text-body">
            Select research areas above and click search to discover papers.
          </p>
        </div>
      </div>
    </div>
  );
};