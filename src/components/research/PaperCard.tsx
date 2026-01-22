import { useState } from 'react';
import { Calendar, ExternalLink, Users, Brain, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { RESEARCH_AREAS } from '@/constants/research-areas';
import { usePaperActions } from '@/hooks/usePaperActions';
import { useToast } from '@/hooks/use-toast';
import { sanitizeText } from '@/utils/validation';
import type { Paper } from '@/types/research';

interface PaperCardProps {
  paper: Paper;
  index: number;
}

// Area color mappings
const areaColorMap: Record<string, { bg: string; text: string; border: string; badge: string; icon: string }> = {
  ai: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100', icon: 'bg-indigo-500' },
  robotics: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', badge: 'bg-pink-100', icon: 'bg-pink-500' },
  cv: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100', icon: 'bg-green-500' },
  nlp: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100', icon: 'bg-purple-500' },
  llm: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100', icon: 'bg-orange-500' },
  multimodal: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-100', icon: 'bg-cyan-500' },
  agents: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100', icon: 'bg-rose-500' },
  mlops: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badge: 'bg-sky-100', icon: 'bg-sky-500' },
  safety: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100', icon: 'bg-amber-500' },
  rl: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100', icon: 'bg-emerald-500' },
};

export const PaperCard = ({ paper, index }: PaperCardProps) => {
  const { selectPaper, isSelecting, isPaperSelected } = usePaperActions();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);

  const handleSelectPaper = async () => {
    if (!paper.id || paper.id.trim() === '') {
      toast({
        title: "Error",
        description: "Invalid paper ID. Cannot select paper.",
        variant: "destructive",
      });
      return;
    }

    try {
      await selectPaper(paper.id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getPaperAreaInfo = (title: string) => {
    const titleLower = title.toLowerCase();
    let bestMatch = { area: RESEARCH_AREAS[0], score: 0 };

    for (const area of RESEARCH_AREAS) {
      let score = 0;

      for (const keyword of area.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (titleLower.includes(keywordLower)) {
          if (['artificial intelligence', 'machine learning', 'deep learning', 'robotics', 'computer vision', 'large language model'].includes(keywordLower)) {
            score += 10;
          } else if (['ai', 'ml', 'cv', 'robot', 'vision', 'llm', 'nlp'].includes(keywordLower)) {
            score += 5;
          } else {
            score += 1;
          }
        }
      }

      if (score > bestMatch.score) {
        bestMatch = { area, score };
      }
    }

    return {
      id: bestMatch.area.id,
      label: bestMatch.area.label,
      color: bestMatch.area.color,
      icon: bestMatch.area.icon
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const areaInfo = getPaperAreaInfo(paper.title);
  const AreaIcon = areaInfo.icon;
  const isAlreadySelected = isPaperSelected(paper.id);
  const colors = areaColorMap[areaInfo.id] || areaColorMap.ai;

  return (
    <div
      className="paper-card card-interactive group"
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'backwards'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle gradient background on hover */}
      <div
        className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${colors.bg} ${
          isHovered ? 'opacity-50' : 'opacity-0'
        }`}
      />

      <div className="relative space-y-6">
        {/* Header with area badge and icon */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            {/* Area badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors.badge} ${colors.text}`}>
                <AreaIcon className="w-3 h-3" />
                {areaInfo.label}
              </span>
              <span className="text-xs text-slate-400">
                {paper.source}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors duration-300">
              {sanitizeText(paper.title)}
            </h3>
          </div>

          {/* Icon indicator */}
          <div
            className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 transform ${
              isAlreadySelected
                ? `${colors.icon} text-white scale-110`
                : isHovered
                  ? `${colors.badge} ${colors.text} scale-105`
                  : 'bg-slate-100 text-slate-400'
            }`}
          >
            <AreaIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatDate(paper.published_date)}
          </div>
          {paper.authors && paper.authors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>
                {paper.authors.slice(0, 2).join(', ')}
                {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
              </span>
            </div>
          )}
        </div>

        {/* Summary section */}
        {paper.summary && (
          <div
            className={`p-5 rounded-xl space-y-3 transition-all duration-300 border ${
              isHovered ? `${colors.bg} ${colors.border}` : 'bg-slate-50 border-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isHovered ? colors.badge : 'bg-white'}`}>
                <Sparkles className={`w-4 h-4 ${isHovered ? colors.text : 'text-slate-400'}`} />
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm text-slate-700 leading-relaxed ${
                    !showFullSummary ? 'line-clamp-3' : ''
                  }`}
                >
                  {sanitizeText(paper.summary)}
                </p>
                {paper.summary.length > 200 && (
                  <button
                    onClick={() => setShowFullSummary(!showFullSummary)}
                    className={`text-sm font-medium mt-2 transition-colors ${colors.text} hover:opacity-80`}
                  >
                    {showFullSummary ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
            {paper.importance && (
              <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                <span className="text-xs font-medium text-slate-500">Impact:</span>
                <span className="text-xs text-slate-700">{paper.importance}</span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSelectPaper}
            disabled={isSelecting || isAlreadySelected}
            className={`search-button comet-button flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 transition-all duration-300 ${
              isAlreadySelected
                ? 'bg-green-500 shadow-green-500/30'
                : isSelecting
                  ? 'opacity-70 cursor-wait'
                  : ''
            }`}
          >
            {isSelecting ? (
              <>
                <div className="loading-spinner w-4 h-4" />
                <span>Processing...</span>
              </>
            ) : isAlreadySelected ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Script Generated</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Generate Script</span>
                <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
              </>
            )}
          </button>

          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="comet-button-secondary inline-flex items-center gap-2 hover:-translate-y-0.5 transition-all duration-300"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Paper</span>
          </a>
        </div>
      </div>
    </div>
  );
};
