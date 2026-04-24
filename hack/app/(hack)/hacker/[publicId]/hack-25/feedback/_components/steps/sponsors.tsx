'use client';

import { useState } from 'react';
import { Textarea } from '@/src/components/ui/textarea';
import { HACK_25_SPONSORS } from '@/src/lib/schemas/feedback.schema';
import { useFeedbackStore } from '@/src/store/feedback.store';

export function Sponsors() {
  const {
    formData,
    setSponsorUnaidedRecall,
    setSponsorsInteracted,
    setSponsorWorkIntent,
    setSponsorComments,
  } = useFeedbackStore();

  const [isRecallLocked, setIsRecallLocked] = useState(
    !!formData.sponsorUnaidedRecall && formData.sponsorUnaidedRecall.length > 0,
  );

  const hasUnaidedRecall =
    formData.sponsorUnaidedRecall && formData.sponsorUnaidedRecall.length > 0;

  const toggleSponsor = (sponsorId: string) => {
    const current = formData.sponsorsInteracted || [];
    if (current.includes(sponsorId)) {
      setSponsorsInteracted(current.filter((s) => s !== sponsorId));
    } else {
      setSponsorsInteracted([...current, sponsorId]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 font-bold text-2xl">Sponsors</h2>
        <p className="text-muted-foreground">
          Ayúdanos a entender el impacto de nuestros sponsors.
        </p>
      </div>

      {/* Q8: Unaided Recall - ALWAYS SHOWN FIRST */}
      <div className="space-y-3">
        <label htmlFor="sponsorUnaidedRecall" className="block font-semibold">
          Sin buscar, ¿qué sponsors recuerdas de Platanus Hack 25?{' '}
          <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="sponsorUnaidedRecall"
          value={formData.sponsorUnaidedRecall || ''}
          onChange={(e) => setSponsorUnaidedRecall(e.target.value)}
          onBlur={() => {
            if (hasUnaidedRecall) {
              setIsRecallLocked(true);
            }
          }}
          placeholder="Escribe los nombres de los sponsors que recuerdes..."
          rows={3}
          disabled={isRecallLocked}
          className="resize-none bg-muted/40"
        />
        {isRecallLocked && (
          <p className="text-muted-foreground text-sm">
            Ya guardamos tu respuesta. No podrás editarla.
          </p>
        )}
      </div>

      {/* Q9: Sponsors Interacted - ONLY SHOWN AFTER Q8 HAS VALUE */}
      {isRecallLocked && hasUnaidedRecall && (
        <div className="space-y-3">
          <p className="block font-semibold">
            ¿Con qué sponsors interactuaste?
          </p>
          <p className="text-muted-foreground text-sm">
            Selecciona todos los que apliquen.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {HACK_25_SPONSORS.map((sponsor) => (
              <label
                key={sponsor.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                  formData.sponsorsInteracted?.includes(sponsor.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-transparent hover:border-primary/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    formData.sponsorsInteracted?.includes(sponsor.id) || false
                  }
                  onChange={() => toggleSponsor(sponsor.id)}
                  className="sr-only"
                />
                <span className="font-medium text-sm">{sponsor.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Q10: Sponsor Work Intent */}
      <div className="space-y-3">
        <p className="block font-semibold">
          ¿Postularías a trabajar en alguno de los sponsors?
        </p>
        <div className="space-y-2">
          {[
            { value: 'yes', label: 'Sí, me interesa' },
            { value: 'no', label: 'No me interesa' },
            { value: 'already_did', label: 'Ya postulé / Ya trabajo en uno' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                formData.sponsorWorkIntent === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-transparent hover:border-primary/30'
              }`}
            >
              <input
                type="radio"
                name="sponsorWorkIntent"
                value={option.value}
                checked={formData.sponsorWorkIntent === option.value}
                onChange={() =>
                  setSponsorWorkIntent(
                    option.value as 'yes' | 'no' | 'already_did',
                  )
                }
                className="sr-only"
              />
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Q11: Sponsor Comments */}
      <div className="space-y-3">
        <label htmlFor="sponsorComments" className="block font-semibold">
          ¿Algún comentario sobre los sponsors?
        </label>
        <Textarea
          id="sponsorComments"
          value={formData.sponsorComments || ''}
          onChange={(e) => setSponsorComments(e.target.value)}
          placeholder="Comentarios adicionales sobre los sponsors..."
          rows={3}
          className="resize-none bg-muted/40"
        />
        <p className="text-muted-foreground text-sm">Opcional</p>
      </div>
    </div>
  );
}
