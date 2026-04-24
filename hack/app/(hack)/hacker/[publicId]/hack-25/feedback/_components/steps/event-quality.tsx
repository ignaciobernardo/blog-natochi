'use client';

import type { EventQualityRatings } from '@/src/lib/db/schema';
import { EVENT_QUALITY_LABELS } from '@/src/lib/schemas/feedback.schema';
import { useFeedbackStore } from '@/src/store/feedback.store';

const RATING_GROUPS = [
  {
    title: 'Infraestructura',
    items: ['oficina', 'wifi', 'comida'] as const,
  },
  {
    title: 'Software & Comunicación',
    items: ['software', 'comunicacion', 'branding'] as const,
  },
  {
    title: 'Personas',
    items: ['mentores', 'jueces', 'sponsors', 'nivelTecnico'] as const,
  },
  {
    title: 'Competencia',
    items: [
      'tracks',
      'premios',
      'procesoEvaluacion',
      'publicVoting',
      'organizacion',
    ] as const,
  },
];

function PlatanusIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block bg-current ${className || ''}`.trim()}
      style={{
        maskImage: 'url(/assets/logos/platanus-isotype.svg)',
        WebkitMaskImage: 'url(/assets/logos/platanus-isotype.svg)',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}

function BananaRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((banana) => (
        <button
          key={banana}
          type="button"
          onClick={() => onChange(banana)}
          className={`text-2xl transition-colors ${
            banana <= value
              ? 'text-primary'
              : 'text-muted-foreground/30 hover:text-primary/50'
          }`}
          aria-label={`${banana} plátanos`}
        >
          <PlatanusIcon className="h-6 w-6" />
        </button>
      ))}
    </div>
  );
}

export function EventQuality() {
  const { formData, setEventQualityRating } = useFeedbackStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 font-bold text-2xl">Calidad del evento</h2>
        <p className="text-muted-foreground">
          Califica los siguientes aspectos del evento (1-5 plátanos).
        </p>
      </div>

      {RATING_GROUPS.map((group) => (
        <div key={group.title} className="space-y-4">
          <h3 className="font-semibold text-lg text-primary">{group.title}</h3>
          <div className="space-y-3">
            {group.items.map((item) => (
              <div
                key={item}
                className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">
                  {EVENT_QUALITY_LABELS[item as keyof EventQualityRatings]}
                </span>
                <BananaRating
                  value={formData.eventQualityRatings[item]}
                  onChange={(value) =>
                    setEventQualityRating(
                      item as keyof EventQualityRatings,
                      value,
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
