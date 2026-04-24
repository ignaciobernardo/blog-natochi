'use client';

import { useFeedbackStore } from '@/src/store/feedback.store';

interface MentorInfo {
  id: string;
  name: string | null;
}

interface OverallExperienceProps {
  mentor: MentorInfo | null;
}

function NumericRating({
  value,
  onChange,
  options,
  leftLabel,
  rightLabel,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
  options: number[];
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="w-full overflow-x-auto">
        <div
          className="grid min-w-[520px] gap-2"
          style={{
            gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
          }}
        >
          {options.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className={`aspect-square w-full rounded-lg border-2 font-bold transition-colors ${
                value === rating
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-transparent hover:border-primary/50'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export function OverallExperience({ mentor }: OverallExperienceProps) {
  const {
    formData,
    setOverallRating,
    setNpsScore,
    setParticipationIntent,
    setMentorRating,
  } = useFeedbackStore();

  return (
    <div className="space-y-10">
      <div>
        <h2 className="mb-2 font-bold text-2xl">Experiencia General</h2>
        <p className="text-muted-foreground">
          Cuéntanos cómo fue tu experiencia en Platanus Hack 25.
        </p>
      </div>

      {/* Q1: Overall Rating 1-10 */}
      <div className="space-y-4">
        <p className="block font-semibold">
          ¿Cómo calificarías tu experiencia en Platanus Hack 25?
        </p>
        <NumericRating
          value={formData.overallRating}
          onChange={setOverallRating}
          options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
          leftLabel="Muy mala"
          rightLabel="Excelente"
        />
      </div>

      {/* Q2: NPS Score 0-10 */}
      <div className="space-y-4">
        <p className="block font-semibold">
          ¿Qué tan probable es que recomiendes Platanus Hack a un amig@?
        </p>
        <NumericRating
          value={formData.npsScore}
          onChange={setNpsScore}
          options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
          leftLabel="Nada probable"
          rightLabel="Muy probable"
        />
      </div>

      {/* Mentor Rating - Only shown if team has a mentor */}
      {mentor && (
        <div className="space-y-4">
          <p className="block font-semibold">
            ¿Cómo calificarías tu experiencia con tu mentor{' '}
            {mentor.name ? (
              <span className="text-primary">{mentor.name}</span>
            ) : (
              ''
            )}
            ?
          </p>
          <NumericRating
            value={formData.mentorRating}
            onChange={setMentorRating}
            options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            leftLabel="Muy mala"
            rightLabel="Excelente"
          />
        </div>
      )}

      {/* Q3: Participation Intent */}
      <div className="space-y-4">
        <p className="block font-semibold">
          ¿Participarías de nuevo en los próximos dos años?
        </p>
        <div className="space-y-3">
          {[
            { value: 'yes', label: 'Sí, definitivamente' },
            { value: 'maybe', label: 'Tal vez' },
            { value: 'no', label: 'No' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                formData.participationIntent === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-transparent hover:border-primary/30'
              }`}
            >
              <input
                type="radio"
                name="participationIntent"
                value={option.value}
                checked={formData.participationIntent === option.value}
                onChange={() =>
                  setParticipationIntent(option.value as 'yes' | 'no' | 'maybe')
                }
                className="sr-only"
              />
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
