'use client';

import type { TeamSize } from '@/src/lib/types/application';
import { useApplicationStore } from '@/src/store/application.store';

export function TeamSizeStep() {
  const { formData, setTeamSize } = useApplicationStore();

  const handleSelect = (size: TeamSize) => {
    setTeamSize(size);
  };

  const sizes: TeamSize[] = [3, 4, 5];

  return (
    <div className="space-y-8">
      <h2 className="font-bold text-3xl">hackers.count</h2>

      <div className="space-y-6 text-secondary-foreground">
        <p>
          <span className="font-semibold text-foreground">cuántos son?</span>{' '}
          recuerda que los equipos son de 3 a 5 hackers.
        </p>
        <p className="font-semibold text-foreground">tamaño del equipo</p>
      </div>

      {/* Size options */}
      <div className="space-y-4">
        {sizes.map((size) => (
          <label
            key={size}
            className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors ${
              formData.teamSize === size
                ? 'border-primary bg-primary/10'
                : 'border-border bg-transparent'
            }`}
          >
            <input
              type="radio"
              name="teamSize"
              value={size}
              checked={formData.teamSize === size}
              onChange={() => handleSelect(size)}
              className="sr-only"
            />
            <div>
              <div className="font-semibold">{size}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
