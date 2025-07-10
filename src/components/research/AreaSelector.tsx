import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RESEARCH_AREAS } from '@/constants/research-areas';

interface AreaSelectorProps {
  selectedAreas: string[];
  onToggleArea: (areaId: string) => void;
}

export const AreaSelector = ({ selectedAreas, onToggleArea }: AreaSelectorProps) => {
  return (
    <div className="comet-section">
      <div className="comet-container">
        {/* Minimal section header */}
        <div className="text-center mb-16">
          <h2 className="text-heading mb-4">
            Research Areas
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Select the fields you want to explore
          </p>
        </div>
        
        {/* Clean area cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RESEARCH_AREAS.map(area => {
            const Icon = area.icon;
            const isSelected = selectedAreas.includes(area.id);
            
            return (
              <div 
                key={area.id} 
                className={`research-area-card group ${isSelected ? 'selected' : ''}`}
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
                  {/* Card header with clean layout */}
                  <div className="flex items-center justify-between">
                    <div className={`p-4 rounded-xl transition-all duration-300 ${
                      isSelected 
                        ? 'bg-primary/10 text-primary' 
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
                  
                  {/* Content with perfect hierarchy */}
                  <div className="space-y-3">
                    <Label 
                      htmlFor={area.id} 
                      id={`area-label-${area.id}`}
                      className={`text-subheading cursor-pointer transition-colors ${
                        isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                      }`}
                    >
                      {area.label}
                    </Label>
                    
                    <p id={`area-desc-${area.id}`} className="text-caption leading-relaxed">
                      {area.keywords.slice(0, 3).join(', ')} and related topics
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