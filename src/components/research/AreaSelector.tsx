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
    <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg mb-12 sm:mb-16 p-6 sm:p-8 lg:p-10">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="p-3 bg-blue-600 rounded-xl shadow-md border-2 border-blue-600">
          <Filter className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Research Areas</h3>
          <p className="text-base text-gray-700 font-medium">Select areas to find papers</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {RESEARCH_AREAS.map(area => {
          const Icon = area.icon;
          const isSelected = selectedAreas.includes(area.id);
          
          return (
            <div 
              key={area.id} 
              className={`relative bg-white border-2 rounded-lg shadow-md p-6 cursor-pointer group transition-all duration-300 ${
                isSelected 
                  ? 'border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                  : 'border-gray-300 hover:border-blue-400 hover:shadow-lg hover:bg-blue-25'
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
              <div className="flex items-center space-x-4">
                <Checkbox 
                  id={area.id} 
                  checked={isSelected} 
                  onCheckedChange={() => onToggleArea(area.id)}
                  className="flex-shrink-0 w-5 h-5"
                  aria-describedby={`area-desc-${area.id}`}
                />
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`p-3 rounded-xl flex-shrink-0 transition-all duration-200 border-2 ${
                    isSelected 
                      ? 'bg-blue-100 border-blue-600 shadow-sm' 
                      : 'bg-gray-100 border-gray-400 group-hover:bg-blue-50 group-hover:border-blue-500'
                  }`}>
                    <Icon className={`w-6 h-6 transition-colors ${
                      isSelected ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-600'
                    }`} aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <Label 
                      htmlFor={area.id} 
                      id={`area-label-${area.id}`}
                      className={`font-bold cursor-pointer text-lg transition-colors block ${
                        isSelected ? 'text-blue-800' : 'text-gray-900 group-hover:text-blue-700'
                      }`}
                      style={{ color: isSelected ? '#1e40af' : '#111827' }}
                    >
                      {area.label}
                    </Label>
                    <p id={`area-desc-${area.id}`} className="text-sm text-gray-600 mt-1 font-medium">
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
  );
};