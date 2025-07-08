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
    <Card className="glass shadow-large border-0 mb-12">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Filter className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Research Areas</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RESEARCH_AREAS.map(area => {
            const Icon = area.icon;
            const isSelected = selectedAreas.includes(area.id);
            
            return (
              <div 
                key={area.id} 
                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? `${area.gradient} border-primary shadow-medium` 
                    : 'bg-card hover:bg-muted border-border hover:border-primary/30'
                }`}
                onClick={() => onToggleArea(area.id)}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id={area.id} 
                    checked={isSelected} 
                    onChange={() => onToggleArea(area.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-primary/10'}`}>
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <Label htmlFor={area.id} className="font-medium cursor-pointer">
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