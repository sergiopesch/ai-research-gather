import { useState, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RESEARCH_AREAS, TOPIC_ITEMS } from '@/constants/research-areas';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface AreaSelectorProps {
  selectedAreas: string[];
  onToggleArea: (areaId: string) => void;
  selectedTopics?: string[];
  onToggleTopic?: (topicId: string) => void;
}

// Color mappings for each area
const areaColors: Record<string, { bg: string; border: string; text: string; icon: string; selectedBg: string }> = {
  ai: {
    bg: 'hover:bg-indigo-50',
    border: 'border-indigo-500',
    text: 'text-indigo-600',
    icon: 'bg-indigo-100 text-indigo-600',
    selectedBg: 'bg-indigo-50'
  },
  robotics: {
    bg: 'hover:bg-pink-50',
    border: 'border-pink-500',
    text: 'text-pink-600',
    icon: 'bg-pink-100 text-pink-600',
    selectedBg: 'bg-pink-50'
  },
  cv: {
    bg: 'hover:bg-green-50',
    border: 'border-green-500',
    text: 'text-green-600',
    icon: 'bg-green-100 text-green-600',
    selectedBg: 'bg-green-50'
  },
  nlp: {
    bg: 'hover:bg-purple-50',
    border: 'border-purple-500',
    text: 'text-purple-600',
    icon: 'bg-purple-100 text-purple-600',
    selectedBg: 'bg-purple-50'
  },
  llm: {
    bg: 'hover:bg-orange-50',
    border: 'border-orange-500',
    text: 'text-orange-600',
    icon: 'bg-orange-100 text-orange-600',
    selectedBg: 'bg-orange-50'
  },
  multimodal: {
    bg: 'hover:bg-cyan-50',
    border: 'border-cyan-500',
    text: 'text-cyan-600',
    icon: 'bg-cyan-100 text-cyan-600',
    selectedBg: 'bg-cyan-50'
  },
  agents: {
    bg: 'hover:bg-rose-50',
    border: 'border-rose-500',
    text: 'text-rose-600',
    icon: 'bg-rose-100 text-rose-600',
    selectedBg: 'bg-rose-50'
  },
  mlops: {
    bg: 'hover:bg-sky-50',
    border: 'border-sky-500',
    text: 'text-sky-600',
    icon: 'bg-sky-100 text-sky-600',
    selectedBg: 'bg-sky-50'
  },
  safety: {
    bg: 'hover:bg-amber-50',
    border: 'border-amber-500',
    text: 'text-amber-600',
    icon: 'bg-amber-100 text-amber-600',
    selectedBg: 'bg-amber-50'
  },
  rl: {
    bg: 'hover:bg-emerald-50',
    border: 'border-emerald-500',
    text: 'text-emerald-600',
    icon: 'bg-emerald-100 text-emerald-600',
    selectedBg: 'bg-emerald-50'
  }
};

export const AreaSelector = ({
  selectedAreas,
  onToggleArea,
  selectedTopics = [],
  onToggleTopic
}: AreaSelectorProps) => {
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const toggleExpand = useCallback((areaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedArea(prev => prev === areaId ? null : areaId);
  }, []);

  const getTopicsForArea = useCallback((areaId: string) => {
    return TOPIC_ITEMS.filter(topic => topic.areaId === areaId);
  }, []);

  const getSelectedTopicsCount = useCallback((areaId: string) => {
    return TOPIC_ITEMS.filter(
      topic => topic.areaId === areaId && selectedTopics.includes(topic.id)
    ).length;
  }, [selectedTopics]);

  return (
    <div className="comet-section">
      <div className="comet-container">
        {/* Section header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="badge-animated mb-6">
            <Sparkles className="w-4 h-4 animate-pulse-glow" />
            <span>Select Your Interests</span>
          </div>
          <h2 className="text-heading mb-4">
            Research Areas
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Choose broad categories or expand to select specific topics
          </p>
        </div>

        {/* Research area grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {RESEARCH_AREAS.map((area, index) => {
            const Icon = area.icon;
            const isSelected = selectedAreas.includes(area.id);
            const isExpanded = expandedArea === area.id;
            const topics = getTopicsForArea(area.id);
            const selectedCount = getSelectedTopicsCount(area.id);
            const colors = areaColors[area.id];

            return (
              <div
                key={area.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <div
                  className={`research-area-card group relative overflow-hidden transition-all duration-300 ${colors.bg} ${
                    isSelected ? `selected border-2 ${colors.border} ${colors.selectedBg}` : ''
                  } ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}
                  onClick={() => onToggleArea(area.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-labelledby={`area-label-${area.id}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleArea(area.id);
                    }
                  }}
                >
                  <div className="relative space-y-3">
                    {/* Card header */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-3 rounded-xl transition-all duration-300 transform ${
                          isSelected
                            ? `${colors.icon} scale-110`
                            : `bg-slate-100 text-slate-500 group-hover:scale-105`
                        }`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <Checkbox
                        id={area.id}
                        checked={isSelected}
                        onCheckedChange={() => onToggleArea(area.id)}
                        className={`transition-all duration-200 ${isSelected ? `border-${area.colorClass}` : ''}`}
                        aria-describedby={`area-desc-${area.id}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <Label
                        htmlFor={area.id}
                        id={`area-label-${area.id}`}
                        className={`text-base font-semibold cursor-pointer transition-colors duration-200 block ${
                          isSelected ? colors.text : 'text-slate-800 group-hover:text-slate-900'
                        }`}
                      >
                        {area.label}
                      </Label>

                      <p id={`area-desc-${area.id}`} className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {area.keywords.slice(0, 3).join(', ')}
                      </p>
                    </div>

                    {/* Expand button for topic selection */}
                    {topics.length > 0 && onToggleTopic && (
                      <button
                        onClick={(e) => toggleExpand(area.id, e)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          isExpanded
                            ? `${colors.icon}`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>
                          {selectedCount > 0 ? `${selectedCount} topics selected` : 'Select topics'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded topics panel */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      isExpanded ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
                    }`}
                  >
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      {topics.map((topic, topicIndex) => {
                        const isTopicSelected = selectedTopics.includes(topic.id);
                        return (
                          <div
                            key={topic.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              isTopicSelected
                                ? `${colors.selectedBg} ${colors.text}`
                                : 'hover:bg-slate-100 text-slate-600'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTopic?.(topic.id);
                            }}
                            style={{
                              animationDelay: `${topicIndex * 30}ms`,
                              animation: isExpanded ? 'fade-in 0.2s ease-out forwards' : 'none'
                            }}
                          >
                            <Checkbox
                              checked={isTopicSelected}
                              onCheckedChange={() => onToggleTopic?.(topic.id)}
                              className="w-3.5 h-3.5"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-xs font-medium">{topic.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected count indicator */}
        {selectedAreas.length > 0 && (
          <div className="mt-10 text-center animate-fade-in">
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-soft">
              <div className="flex -space-x-2">
                {selectedAreas.slice(0, 4).map(areaId => {
                  const area = RESEARCH_AREAS.find(a => a.id === areaId);
                  if (!area) return null;
                  const Icon = area.icon;
                  const colors = areaColors[areaId];
                  return (
                    <div
                      key={areaId}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white ${colors.icon}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  );
                })}
                {selectedAreas.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white">
                    <span className="text-xs font-semibold text-slate-600">+{selectedAreas.length - 4}</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-slate-700">
                {selectedAreas.length} {selectedAreas.length === 1 ? 'area' : 'areas'} selected
                {selectedTopics.length > 0 && (
                  <span className="text-slate-500"> · {selectedTopics.length} topics</span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
