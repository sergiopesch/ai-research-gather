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
    <div className="glass rounded-xl shadow-large border-0 mb-12 sm:mb-16">
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="p-2 sm:p-3 bg-gradient-primary rounded-xl shadow-soft">
            <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold">Research Areas</h3>
            <p className="text-sm text-muted-foreground">Select areas to discover papers</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {RESEARCH_AREAS.map(area => {
            const Icon = area.icon;
            const isSelected = selectedAreas.includes(area.id);
            
            return (
              <div 
                key={area.id} 
                className={`brand-card p-4 sm:p-5 cursor-pointer group transition-all duration-300 ${
                  isSelected 
                    ? 'border-primary shadow-glow bg-gradient-primary/5' 
                    : 'hover:border-primary/50 hover:shadow-medium'
                }`}
                onClick={() => onToggleArea(area.id)}
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Checkbox 
                    id={area.id} 
                    checked={isSelected} 
                    onCheckedChange={() => onToggleArea(area.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0 w-5 h-5"
                  />
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 transition-all duration-200 ${
                      isSelected 
                        ? 'bg-primary/20 shadow-soft' 
                        : 'bg-muted group-hover:bg-primary/10'
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors ${
                        isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                      }`} />
                    </div>
                    <Label htmlFor={area.id} className="font-semibold cursor-pointer text-base truncate group-hover:text-primary transition-colors">
                      {area.label}
                    </Label>
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