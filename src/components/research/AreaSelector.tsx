import { Filter } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RESEARCH_AREAS } from '@/constants/research-areas';

interface AreaSelectorProps {
  selectedAreas: string[];
  onToggleArea: (areaId: string) => void;
}

export const AreaSelector = ({ selectedAreas, onToggleArea }: AreaSelectorProps) => {
  return (
    <div className="comet-section py-16">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-4">
            Research Areas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the fields you're interested in to discover relevant papers
          </p>
        </div>
        
        {/* Area cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {RESEARCH_AREAS.map(area => {
            const Icon = area.icon;
            const isSelected = selectedAreas.includes(area.id);
            
            return (
              <div 
                key={area.id} 
                className={`area-card ${isSelected ? 'selected' : ''}`}
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
                <div className="flex items-start space-x-4">
                  <Checkbox 
                    id={area.id} 
                    checked={isSelected} 
                    onCheckedChange={() => onToggleArea(area.id)}
                    className="mt-1 flex-shrink-0"
                    aria-describedby={`area-desc-${area.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`p-3 rounded-2xl transition-all duration-300 ${
                        isSelected 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary'
                      }`}>
                        <Icon className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <Label 
                        htmlFor={area.id} 
                        id={`area-label-${area.id}`}
                        className={`text-xl font-medium cursor-pointer transition-colors ${
                          isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                        }`}
                      >
                        {area.label}
                      </Label>
                    </div>
                    <p id={`area-desc-${area.id}`} className="text-sm text-muted-foreground leading-relaxed">
                      Explore papers in {area.keywords.slice(0, 4).join(', ')} and related topics
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};