import { Target } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RESEARCH_AREAS } from '@/constants/research-areas';

interface AreaSelectorProps {
  selectedAreas: string[];
  onToggleArea: (areaId: string) => void;
}

export const AreaSelector = ({ selectedAreas, onToggleArea }: AreaSelectorProps) => {
  return (
    <div className="premium-section">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Enhanced section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-glass border border-border/30 mb-6">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Research Focus</span>
          </div>
          
          <h2 className="text-heading mb-6">
            Choose Your Research Areas
          </h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Select the fields that align with your interests to discover the most relevant papers and insights
          </p>
        </div>
        
        {/* Premium area cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {RESEARCH_AREAS.map(area => {
            const Icon = area.icon;
            const isSelected = selectedAreas.includes(area.id);
            
            return (
              <div 
                key={area.id} 
                className={`area-card group ${isSelected ? 'selected' : ''}`}
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
                <div className="space-y-4">
                  {/* Enhanced card header */}
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      isSelected 
                        ? 'bg-primary/10 text-primary shadow-brand' 
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary'
                    }`}>
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <Checkbox 
                      id={area.id} 
                      checked={isSelected} 
                      onCheckedChange={() => onToggleArea(area.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      aria-describedby={`area-desc-${area.id}`}
                    />
                  </div>
                  
                  {/* Enhanced content */}
                  <div className="space-y-3">
                    <Label 
                      htmlFor={area.id} 
                      id={`area-label-${area.id}`}
                      className={`text-lg font-semibold cursor-pointer transition-colors ${
                        isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                      }`}
                    >
                      {area.label}
                    </Label>
                    
                    <p id={`area-desc-${area.id}`} className="text-sm text-muted-foreground leading-relaxed">
                      Discover cutting-edge research in {area.keywords.slice(0, 3).join(', ')} and related fields
                    </p>
                    
                    {/* Tag indicators */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {area.keywords.slice(0, 3).map((keyword, index) => (
                        <span 
                          key={index}
                          className={`px-2 py-1 text-xs rounded-md transition-colors ${
                            isSelected 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground group-hover:bg-primary/5'
                          }`}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
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