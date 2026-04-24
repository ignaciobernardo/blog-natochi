'use client';

import { useFeedbackStore } from '@/src/store/feedback.store';

export function Future() {
  const {
    formData,
    setStartupIntent,
    setFundingPreference,
    setStartupAmbition,
  } = useFeedbackStore();

  const showFundingQuestions =
    formData.startupIntent === 'yes' ||
    formData.startupIntent === 'already_building';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 font-bold text-2xl">Futuro</h2>
        <p className="text-muted-foreground">
          Cuéntanos sobre tus planes a futuro.
        </p>
      </div>

      {/* Q12: Startup Intent */}
      <div className="space-y-3">
        <p className="block font-semibold">
          En los próximos 3 años, ¿te interesa construir una startup?{' '}
          <span className="text-destructive">*</span>
        </p>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Sí, me interesa' },
            { value: 'no', label: 'No me interesa' },
            { value: 'already_building', label: 'Ya estoy construyendo una' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                formData.startupIntent === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-transparent hover:border-primary/30'
              }`}
            >
              <input
                type="radio"
                name="startupIntent"
                value={option.value}
                checked={formData.startupIntent === option.value}
                onChange={() =>
                  setStartupIntent(
                    option.value as 'yes' | 'no' | 'already_building',
                  )
                }
                className="sr-only"
              />
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Q13: Funding Preference - CONDITIONAL */}
      {showFundingQuestions && (
        <div className="space-y-3">
          <p className="block font-semibold">¿Cómo la financiarías?</p>
          <div className="space-y-2">
            {[
              {
                value: 'bootstrapped',
                label: 'Bootstrapped (sin inversión externa)',
              },
              { value: 'vc', label: 'Venture Capital / Inversión' },
              { value: 'other', label: 'Otro' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                  formData.fundingPreference === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-transparent hover:border-primary/30'
                }`}
              >
                <input
                  type="radio"
                  name="fundingPreference"
                  value={option.value}
                  checked={formData.fundingPreference === option.value}
                  onChange={() =>
                    setFundingPreference(
                      option.value as 'bootstrapped' | 'vc' | 'other',
                    )
                  }
                  className="sr-only"
                />
                <span className="font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Q14: Startup Ambition - CONDITIONAL */}
      {showFundingQuestions && (
        <div className="space-y-3">
          <p className="block font-semibold">
            ¿Qué ambición tienes con tu startup?
          </p>
          <p className="text-muted-foreground text-sm">
            En términos de ARR (Annual Recurring Revenue) anual.
          </p>
          <div className="space-y-2">
            {[
              { value: 'up_to_100k', label: 'Hasta $100K USD' },
              { value: '100k_to_1m', label: '$100K - $1M USD' },
              { value: '1m_to_10m', label: '$1M - $10M USD' },
              { value: '10m_plus', label: 'Más de $10M USD' },
              { value: 'not_sure', label: 'No estoy seguro' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                  formData.startupAmbition === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-transparent hover:border-primary/30'
                }`}
              >
                <input
                  type="radio"
                  name="startupAmbition"
                  value={option.value}
                  checked={formData.startupAmbition === option.value}
                  onChange={() =>
                    setStartupAmbition(
                      option.value as
                        | 'up_to_100k'
                        | '100k_to_1m'
                        | '1m_to_10m'
                        | '10m_plus'
                        | 'not_sure',
                    )
                  }
                  className="sr-only"
                />
                <span className="font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
