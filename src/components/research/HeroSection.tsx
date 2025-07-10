import { Sparkles, ArrowRight } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="premium-hero">
      {/* Sophisticated background elements */}
      <div className="organic-bg">
        <div className="absolute top-16 left-16 w-80 h-80 bg-gradient-premium organic-shape"></div>
        <div className="absolute bottom-16 right-16 w-64 h-64 bg-gradient-ai organic-shape-sm"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-robotics organic-shape opacity-20"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Premium brand badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-glass border border-border/30 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Powered by AI Research Intelligence</span>
          </div>
          
          {/* Impactful headline */}
          <h1 className="text-display mb-8 leading-[0.95]">
            Transform Research into
            <span className="block text-gradient-brand">
              Engaging Podcasts
            </span>
          </h1>
          
          {/* Compelling subtitle */}
          <p className="text-subheading text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover breakthrough research papers and automatically convert them into professional podcast episodes with AI-powered insights and analysis.
          </p>
          
          {/* Premium CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group premium-button px-8 py-4 rounded-full text-lg hover-scale inline-flex items-center gap-3">
              <span>Start Creating</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="premium-button-outline px-8 py-4 rounded-full text-lg hover-scale">
              Browse Research
            </button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-caption">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Live arXiv Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>AI-Powered Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Professional Scripts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};