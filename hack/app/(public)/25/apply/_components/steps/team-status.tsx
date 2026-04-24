'use client';

import { useApplicationStore } from '@/src/store/application.store';

export function TeamStatus() {
  const { formData, setTeamStatus } = useApplicationStore();

  const handleSelect = (status: 'formed' | 'looking') => {
    setTeamStatus(status);
  };

  return (
    <div className="space-y-8">
      <h2 className="font-bold text-3xl">team.any?</h2>

      <div className="space-y-6 text-secondary-foreground">
        <p className="font-semibold text-foreground">
          ya tienes equipo formado?
        </p>
      </div>

      {/* Radio options */}
      <div className="space-y-4">
        <label
          className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors ${
            formData.teamStatus === 'formed'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-transparent'
          }`}
        >
          <input
            type="radio"
            name="teamStatus"
            value="formed"
            checked={formData.teamStatus === 'formed'}
            onChange={() => handleSelect('formed')}
            className="sr-only"
          />
          <div>
            <div className="font-semibold">yes</div>
          </div>
        </label>

        <label
          className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors ${
            formData.teamStatus === 'looking'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-transparent'
          }`}
        >
          <input
            type="radio"
            name="teamStatus"
            value="looking"
            checked={formData.teamStatus === 'looking'}
            onChange={() => handleSelect('looking')}
            className="sr-only"
          />
          <div>
            <div className="font-semibold">
              no, quiero buscar al inicio del evento
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
