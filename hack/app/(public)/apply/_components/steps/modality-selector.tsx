'use client';

import { useState } from 'react';
import { useApplicationStore } from '@/src/store/application.store';

export function ModalitySelector() {
  const { formData, setModality } = useApplicationStore();
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (modality: 'team' | 'solo') => {
    setModality(modality);
    setError(null);
  };

  return (
    <div className="space-y-8">
      <h2 className="font-bold text-3xl">1 || many ?</h2>

      <div className="space-y-6 text-secondary-foreground">
        <div>
          <p className="mb-2 font-semibold text-foreground">
            el evento tiene dos modalidades: team y solo
          </p>
        </div>

        <div>
          <p className="mb-2">
            en la modalidad <span className="text-foreground">team</span>,
            participas con tu equipo de entre 3 a 5 personas. para esta
            modalidad, si aún no tienes equipo, puedes formarlo al inicio del
            evento. esta es la modalidad original del evento y es la{' '}
            <span className="text-foreground">recomendada</span>.
          </p>
        </div>

        <div>
          <p className="mb-2">
            por otro lado está la modalidad{' '}
            <span className="text-foreground">solo</span>, donde compites sin
            equipo. hay un límite de un{' '}
            <span className="text-foreground">10%</span> de los cupos para esta
            modalidad, por lo que tienes mejores chances si postulas como{' '}
            <span className="text-foreground">team</span>.
          </p>
        </div>

        <div>
          <p className="font-semibold text-foreground">
            no está permitido postular con ambas. choose wisely.
          </p>
        </div>
      </div>

      {/* Radio options */}
      <div className="space-y-4">
        <label
          className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors ${
            formData.modality === 'team'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-transparent'
          }`}
        >
          <input
            type="radio"
            name="modality"
            value="team"
            checked={formData.modality === 'team'}
            onChange={() => handleSelect('team')}
            className="sr-only"
          />
          <div>
            <div className="font-semibold">team (recomendado)</div>
          </div>
        </label>

        <label
          className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors ${
            formData.modality === 'solo'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-transparent'
          }`}
        >
          <input
            type="radio"
            name="modality"
            value="solo"
            checked={formData.modality === 'solo'}
            onChange={() => handleSelect('solo')}
            className="sr-only"
          />
          <div>
            <div className="font-semibold">solo</div>
          </div>
        </label>
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}
    </div>
  );
}
