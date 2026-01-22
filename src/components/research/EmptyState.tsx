import { Search, ArrowUp } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="comet-section text-center animate-fade-in">
      <div className="max-w-sm mx-auto space-y-6">
        {/* Icon */}
        <div className="p-6 bg-neutral-50 rounded-xl w-fit mx-auto border border-neutral-100">
          <Search className="w-8 h-8 text-neutral-400" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-neutral-900">
            Ready to explore?
          </h3>
          <p className="text-sm text-neutral-500">
            Select your research interests above and discover the latest papers from arXiv
          </p>
        </div>

        {/* Hint */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 px-3 py-2 rounded-lg bg-neutral-50 w-fit mx-auto">
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Choose topics and click "Find Papers"</span>
        </div>
      </div>
    </div>
  );
};
