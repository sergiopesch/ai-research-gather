import { Mic2 } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="comet-hero">
      {/* Organic background shapes inspired by Comet */}
      <div className="organic-bg">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-primary/5 to-primary/10 organic-shape"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-tl from-accent/10 to-muted/20 organic-shape-sm"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-organic organic-shape"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Elegant subtitle */}
          <p className="text-base text-muted-foreground font-medium mb-8 tracking-wide">
            A new studio from The Notebook Pod
          </p>
          
          {/* Main headline inspired by Comet's typography */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light tracking-tight text-foreground mb-12 leading-[0.9]">
            Create at the speed of
            <span className="block font-light italic text-gradient-modern">
              thought
            </span>
          </h1>
          
          {/* Clean CTA inspired by Comet's button */}
          <div className="flex justify-center">
            <button className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:bg-primary/90 hover:scale-105 shadow-soft hover:shadow-medium">
              <div className="p-1 bg-primary-foreground/10 rounded-full">
                <Mic2 className="w-5 h-5" />
              </div>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};