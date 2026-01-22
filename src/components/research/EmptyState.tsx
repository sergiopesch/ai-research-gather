import { Search, Sparkles, ArrowUp } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="comet-section text-center animate-fade-in">
      <div className="max-w-md mx-auto space-y-8">
        {/* Animated illustration */}
        <div className="relative">
          <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl w-fit mx-auto animate-float border border-indigo-100">
            <Search className="w-12 h-12 text-indigo-400" />
          </div>
          {/* Orbiting sparkle */}
          <div className="absolute top-0 right-1/4">
            <div className="animate-bounce">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Clean messaging */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-slate-900 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            Ready to explore?
          </h3>
          <p className="text-slate-600 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            Select your research interests above and discover the latest papers from arXiv
          </p>
        </div>

        {/* Helpful hint */}
        <div className="flex items-center justify-center gap-2.5 text-sm text-slate-500 animate-fade-in px-4 py-2.5 rounded-full bg-slate-50 w-fit mx-auto" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
          <ArrowUp className="w-4 h-4 text-indigo-500 animate-bounce" />
          <span>Choose topics and click "Find Papers"</span>
        </div>
      </div>
    </div>
  );
};
