import { Sparkles, FileText, Mic, Zap } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="comet-hero relative overflow-hidden">
      {/* Animated gradient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-purple-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-pink-400/20 to-orange-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-gradient-to-br from-cyan-400/15 to-blue-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="comet-container text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Animated badge */}
          <div className="animate-bounce-in">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-soft">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Research Discovery
              </span>
            </div>
          </div>

          {/* Main heading with gradient text */}
          <div className="space-y-4">
            <h1 className="text-display animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
              <span className="text-slate-900">Discover Research.</span>
              <br />
              <span className="text-gradient">Create Podcasts.</span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-xl text-slate-600 max-w-2xl mx-auto animate-fade-in leading-relaxed" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            Find cutting-edge papers from arXiv and transform them into engaging podcast scripts with AI
          </p>

          {/* Feature pills with icons */}
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
            <div className="feature-pill group hover:shadow-soft transition-all duration-300">
              <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Latest arXiv Papers</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-purple-50 text-purple-600 hover:shadow-soft transition-all duration-300 group">
              <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>AI Summaries</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-pink-50 text-pink-600 hover:shadow-soft transition-all duration-300 group">
              <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Podcast Scripts</span>
            </div>
          </div>

          {/* Stats or social proof */}
          <div className="pt-8 animate-fade-in" style={{ animationDelay: '700ms', animationFillMode: 'backwards' }}>
            <div className="inline-flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Live arXiv data</span>
              </div>
              <div className="w-px h-4 bg-slate-300" />
              <span>10 research areas</span>
              <div className="w-px h-4 bg-slate-300" />
              <span>GPT-4 powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
