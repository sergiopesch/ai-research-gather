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
    <Card className="glass shadow-large border-0 mb-8 sm:mb-12">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold">Research Areas</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {RESEARCH_AREAS.map(area => {
            const Icon = area.icon;
            const isSelected = selectedAreas.includes(area.id);
            
            return (
              <div 
                key={area.id} 
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? `${area.gradient} border-primary shadow-medium` 
                    : 'bg-card hover:bg-muted border-border hover:border-primary/30'
                }`}
                onClick={() => onToggleArea(area.id)}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Checkbox 
                    id={area.id} 
                    checked={isSelected} 
                    onChange={() => onToggleArea(area.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0"
                  />
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-white/20' : 'bg-primary/10'}`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <Label htmlFor={area.id} className="font-medium cursor-pointer text-sm sm:text-base truncate">
                      {area.label}
                    </Label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};