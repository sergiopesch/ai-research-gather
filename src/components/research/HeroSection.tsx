import { FileText, ArrowDown } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="comet-hero">
      <div className="comet-container text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Main heading */}
          <div className="space-y-4">
            <h1 className="text-display animate-fade-in text-neutral-900">
              Research Paper Finder
            </h1>
            <p className="text-lg text-neutral-500 animate-fade-in max-w-xl mx-auto" style={{ animationDelay: '100ms' }}>
              Discover the latest papers from arXiv in robotics, computer vision, and large language models
            </p>
          </div>

          {/* Features - minimal */}
          <div className="flex items-center justify-center gap-6 text-sm text-neutral-400 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>arXiv</span>
            </div>
            <span className="text-neutral-300">·</span>
            <span>3 research areas</span>
            <span className="text-neutral-300">·</span>
            <span>AI summaries</span>
          </div>

          {/* Scroll indicator */}
          <div className="pt-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <ArrowDown className="w-5 h-5 text-neutral-300 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};
