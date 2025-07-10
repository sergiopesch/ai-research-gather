import { Filter } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RESEARCH_AREAS } from '@/constants/research-areas';

interface AreaSelectorProps {
  selectedAreas: string[];
  onToggleArea: (areaId: string) => void;
}

export const AreaSelector = ({ selectedAreas, onToggleArea }: AreaSelectorProps) => {
  return (
    <div className="bg-card border-2 border-border rounded-xl shadow-large mb-12 sm:mb-16">
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="p-3 bg-primary rounded-xl shadow-soft border-2 border-primary">
            <Filter className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">Research Areas</h3>
            <p className="text-sm text-muted-foreground">Select areas to find papers</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {RESEARCH_AREAS.map(area => {
            const Icon = area.icon;
            const isSelected = selectedAreas.includes(area.id);
            
            return (
              <div 
                key={area.id} 
                className={`brand-card p-4 sm:p-5 cursor-pointer group transition-all duration-300 border-2 ${
                  isSelected 
                    ? 'border-primary bg-primary/10 shadow-glow ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/60 hover:shadow-medium hover:bg-primary/5'
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
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Checkbox 
                    id={area.id} 
                    checked={isSelected} 
                    onCheckedChange={() => onToggleArea(area.id)}
                    className={`data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground flex-shrink-0 ${
                      isSelected ? 'border-primary' : 'border-muted-foreground hover:border-primary'
                    }`}
                    aria-describedby={`area-desc-${area.id}`}
                  />
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 transition-all duration-200 border ${
                      isSelected 
                        ? 'bg-primary/20 border-primary/30 shadow-soft' 
                        : 'bg-muted border-border group-hover:bg-primary/10 group-hover:border-primary/30'
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors ${
                        isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                      }`} aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <Label 
                        htmlFor={area.id} 
                        id={`area-label-${area.id}`}
                        className={`font-semibold cursor-pointer text-base truncate transition-colors block ${
                          isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                        }`}
                      >
                        {area.label}
                      </Label>
                      <p id={`area-desc-${area.id}`} className="text-sm text-muted-foreground mt-1">
                        {area.keywords.slice(0, 3).join(', ')}...
                      </p>
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