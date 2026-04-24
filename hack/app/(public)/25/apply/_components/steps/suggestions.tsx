'use client';

import { useState } from 'react';
import { useApplicationStore } from '@/src/store/application.store';

export function Suggestions() {
  const { formData, setEventSuggestions } = useApplicationStore();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setEventSuggestions(value);
    setError(null);
  };

  return (
    <div className="space-y-8">
      <h2 className="font-bold text-3xl">hack.suggestions</h2>

      <div className="space-y-6 text-secondary-foreground">
        <p className="font-semibold text-foreground">
          qué te gustaría ver en el evento? *
        </p>

        <p>
          algo no te gustó en otra hackatón? algo que funcionó muy bien?{' '}
          <span className="text-foreground">es tu momento</span>.
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          placeholder="charla con sam altman"
          value={formData.eventSuggestions}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-[200px] w-full rounded border border-border bg-card px-4 py-3 text-foreground placeholder-secondary-foreground focus:border-primary focus:outline-none"
        />
        {error && <div className="text-destructive text-sm">{error}</div>}
      </div>
    </div>
  );
}
