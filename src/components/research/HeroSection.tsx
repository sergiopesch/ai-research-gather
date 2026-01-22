import { Sparkles, FileText, Mic } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="comet-hero relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="comet-container text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Animated badge */}
          <div className="animate-bounce-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/80 border border-border/50 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
              <span className="text-sm font-medium text-foreground">AI-Powered Research Discovery</span>
            </div>
          </div>

          {/* Main heading with staggered animation */}
          <h1 className="text-display text-foreground animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            Discover Research.
            <br />
            <span className="text-muted-foreground">Create Podcasts.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            Find cutting-edge papers from arXiv and transform them into engaging podcast scripts with AI
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Latest arXiv Papers</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>AI Summaries</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <Mic className="w-4 h-4" />
              <span>Podcast Scripts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
