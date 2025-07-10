export const HeroSection = () => {
  return (
    <div className="comet-hero">
      {/* Organic background elements inspired by Comet */}
      <div className="organic-bg">
        <div className="absolute top-20 left-10 w-96 h-96 bg-organic-1 organic-blob"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-organic-2 organic-blob-sm"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-organic-3 organic-blob"></div>
      </div>
      
      <div className="relative comet-container text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Clean subtitle */}
          <p className="text-caption font-medium tracking-wide">
            Research Discovery Tool
          </p>
          
          {/* Main headline with perfect typography */}
          <h1 className="text-display text-foreground leading-[0.9]">
            Browse research at the speed of
            <span className="block font-light italic text-muted-foreground/60">
              thought
            </span>
          </h1>
          
          {/* Simple description */}
          <p className="text-body max-w-2xl mx-auto">
            Discover and analyze academic papers from arXiv with intelligent filtering and automated podcast script generation.
          </p>
          
          {/* Single, focused CTA */}
          <div className="pt-4">
            <button className="comet-button text-lg px-8 py-4">
              Start Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};