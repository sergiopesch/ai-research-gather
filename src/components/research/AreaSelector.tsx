import { RESEARCH_AREAS } from '@/constants/research-areas';

interface AreaSelectorProps {
  selectedAreas: string[];
  onToggleArea: (areaId: string) => void;
}

export const AreaSelector = ({ selectedAreas, onToggleArea }: AreaSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {RESEARCH_AREAS.map((area) => {
        const Icon = area.icon;
        const isSelected = selectedAreas.includes(area.id);

        return (
          <button
            key={area.id}
            type="button"
            onClick={() => onToggleArea(area.id)}
            aria-pressed={isSelected}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950'
            }`}
          >
            <Icon className="h-4 w-4" />
            {area.label}
          </button>
        );
      })}
    </div>
  );
};
