import { Mic2 } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-hero">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.15) 2px, transparent 0),
                         radial-gradient(circle at 75px 75px, rgba(255,255,255,0.1) 2px, transparent 0)`,
        backgroundSize: '100px 100px'
      }}></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white mb-6">
            The Notebook Pod
            <span className="block text-gradient-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Studio
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Transform research papers into podcast episodes
          </p>
        </div>
      </div>
    </div>
  );
};