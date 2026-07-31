import { Check } from 'lucide-react';
import { RESEARCH_AREAS } from '@/constants/research-areas';

interface AreaSelectorProps {
  selectedAreas: string[];
  onToggleArea: (areaId: string) => void;
}

export const AreaSelector = ({ selectedAreas, onToggleArea }: AreaSelectorProps) => {
  return (
    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
      {RESEARCH_AREAS.map((area) => {
        const Icon = area.icon;
        const isSelected = selectedAreas.includes(area.id);

        return (
          <button
            key={area.id}
            type="button"
            onClick={() => onToggleArea(area.id)}
            aria-pressed={isSelected}
            className={`motion-control flex min-h-12 items-center gap-3 rounded-md border px-3.5 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 ${
              isSelected
                ? 'border-stone-900 bg-white text-stone-950'
                : 'border-stone-200 bg-transparent text-stone-500 hover:border-stone-300 hover:bg-white/60 hover:text-stone-800'
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#7d5066]' : 'text-stone-400'}`} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{area.label}</span>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-[#7d5066] text-white' : 'border border-stone-300'}`}>
              {isSelected && <Check className="h-3 w-3" aria-hidden="true" />}
            </span>
          </button>
        );
      })}
    </div>
  );
};
