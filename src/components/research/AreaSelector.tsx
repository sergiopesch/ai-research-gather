import { useState, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RESEARCH_AREAS, TOPIC_ITEMS } from '@/constants/research-areas';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
        {/* Section header */}
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-heading mb-2 text-neutral-900">
            Select Research Areas
          </h2>
          <p className="text-sm text-neutral-500">
            Choose topics to search for papers
          </p>
        </div>

        {/* Research area grid - 3 columns for 3 items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
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
                  className={`research-area-card group relative transition-all duration-200 ${
                    isSelected ? 'selected' : ''
                  }`}
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
                  <div className="space-y-3">
                    {/* Card header */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-2.5 rounded-lg transition-all duration-200 ${
                          isSelected
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <Checkbox
                        id={area.id}
                        checked={isSelected}
                        onCheckedChange={() => onToggleArea(area.id)}
                        className="border-neutral-300 data-[state=checked]:bg-neutral-900 data-[state=checked]:border-neutral-900"
                        aria-describedby={`area-desc-${area.id}`}
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label
                        htmlFor={area.id}
                        id={`area-label-${area.id}`}
                        className={`text-sm font-medium cursor-pointer block ${
                          isSelected ? 'text-neutral-900' : 'text-neutral-700'
                        }`}
                      >
                        {area.label}
                      </label>
                    </div>

                    {/* Expand button for topic selection */}
                    {topics.length > 0 && onToggleTopic && (
                      <button
                        onClick={(e) => toggleExpand(area.id, e)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                          isExpanded
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        <span>
                          {selectedCount > 0 ? `${selectedCount} selected` : 'Topics'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded topics panel */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-out ${
                      isExpanded ? 'max-h-48 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
                    }`}
                  >
                    <div className="pt-3 border-t border-neutral-200 space-y-1">
                      {topics.map((topic) => {
                        const isTopicSelected = selectedTopics.includes(topic.id);
                        return (
                          <div
                            key={topic.id}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all duration-150 ${
                              isTopicSelected
                                ? 'bg-neutral-100 text-neutral-900'
                                : 'hover:bg-neutral-50 text-neutral-600'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTopic?.(topic.id);
                            }}
                          >
                            <Checkbox
                              checked={isTopicSelected}
                              onCheckedChange={() => onToggleTopic?.(topic.id)}
                              className="w-3.5 h-3.5 border-neutral-300 data-[state=checked]:bg-neutral-900 data-[state=checked]:border-neutral-900"
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
            <span className="text-sm text-neutral-500">
              {selectedAreas.length} {selectedAreas.length === 1 ? 'area' : 'areas'} selected
              {selectedTopics.length > 0 && (
                <span> · {selectedTopics.length} topics</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
