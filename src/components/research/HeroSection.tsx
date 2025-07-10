import { Mic2, Sparkles } from 'lucide-react';

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
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-medium text-white/90">Powered by AI</span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white mb-6">
            The Notebook Pod
            <span className="block text-gradient-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Studio
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-8">
            Transform research papers into engaging podcast episodes with AI-powered script generation
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Professional Scripts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>ElevenLabs Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Instant Generation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};