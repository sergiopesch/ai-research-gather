import { useState, useCallback, useMemo } from 'react';
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
        {/* Animated section header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/30 mb-6">
            <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
            <span className="text-sm font-medium text-foreground">Select Your Interests</span>
          </div>
          <h2 className="text-heading mb-4">
            Research Areas
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Choose broad categories or expand to select specific topics
          </p>
        </div>

        {/* Research area grid with staggered animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {RESEARCH_AREAS.map((area, index) => {
            const Icon = area.icon;
            const isSelected = selectedAreas.includes(area.id);
            const isExpanded = expandedArea === area.id;
            const topics = getTopicsForArea(area.id);
            const selectedCount = getSelectedTopicsCount(area.id);

            return (
              <div
                key={area.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <div
                  className={`research-area-card group relative overflow-hidden transition-all duration-300 ${
                    isSelected ? 'selected ring-2 ring-primary/20' : ''
                  } ${isExpanded ? 'ring-2 ring-primary/10' : ''}`}
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
                  {/* Selection indicator animation */}
                  <div
                    className={`absolute inset-0 bg-primary/5 transition-transform duration-500 ease-out ${
                      isSelected ? 'scale-100' : 'scale-0'
                    }`}
                    style={{ transformOrigin: 'center' }}
                  />

                  <div className="relative space-y-3">
                    {/* Card header */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-3 rounded-xl transition-all duration-300 transform ${
                          isSelected
                            ? 'bg-primary text-primary-foreground scale-110'
                            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105'
                        }`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <Checkbox
                        id={area.id}
                        checked={isSelected}
                        onCheckedChange={() => onToggleArea(area.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-200"
                        aria-describedby={`area-desc-${area.id}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <Label
                        htmlFor={area.id}
                        id={`area-label-${area.id}`}
                        className={`text-base font-medium cursor-pointer transition-colors duration-200 block ${
                          isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                        }`}
                      >
                        {area.label}
                      </Label>

                      <p id={`area-desc-${area.id}`} className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {area.keywords.slice(0, 3).join(', ')}
                      </p>
                    </div>

                    {/* Expand button for topic selection */}
                    {topics.length > 0 && onToggleTopic && (
                      <button
                        onClick={(e) => toggleExpand(area.id, e)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          isExpanded
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
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
                    <div className="pt-3 border-t border-border/50 space-y-2">
                      {topics.map((topic, topicIndex) => {
                        const isTopicSelected = selectedTopics.includes(topic.id);
                        return (
                          <div
                            key={topic.id}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              isTopicSelected
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
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
                              className="w-3.5 h-3.5 data-[state=checked]:bg-primary"
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
          <div className="mt-8 text-center animate-fade-in">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted/50 border border-border/30">
              <div className="flex -space-x-2">
                {selectedAreas.slice(0, 3).map(areaId => {
                  const area = RESEARCH_AREAS.find(a => a.id === areaId);
                  if (!area) return null;
                  const Icon = area.icon;
                  return (
                    <div
                      key={areaId}
                      className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background"
                    >
                      <Icon className="w-4 h-4 text-primary-foreground" />
                    </div>
                  );
                })}
                {selectedAreas.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                    <span className="text-xs font-medium">+{selectedAreas.length - 3}</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-foreground">
                {selectedAreas.length} {selectedAreas.length === 1 ? 'area' : 'areas'} selected
                {selectedTopics.length > 0 && ` · ${selectedTopics.length} topics`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
