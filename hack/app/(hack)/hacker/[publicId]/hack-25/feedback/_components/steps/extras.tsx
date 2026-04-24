'use client';

import { MediaUpload } from '@/src/components/ui/media-upload';
import { Textarea } from '@/src/components/ui/textarea';
import { useFeedbackStore } from '@/src/store/feedback.store';

export function Extras() {
  const {
    formData,
    setHowHeardAbout,
    setAdditionalComments,
    setMediaUrls,
    setFeedbackUsagePermission,
  } = useFeedbackStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 font-bold text-2xl">Extras</h2>
        <p className="text-muted-foreground">
          Algunas preguntas finales antes de terminar.
        </p>
      </div>

      {/* Q15: How Heard About */}
      <div className="space-y-3">
        <label htmlFor="howHeardAbout" className="block font-semibold">
          ¿Cómo te enteraste del hackathon?
        </label>
        <Textarea
          id="howHeardAbout"
          value={formData.howHeardAbout || ''}
          onChange={(e) => setHowHeardAbout(e.target.value)}
          placeholder="Redes sociales, amigos, universidad, trabajo..."
          rows={3}
          className="resize-none bg-muted/40"
        />
        <p className="text-muted-foreground text-sm">Opcional</p>
      </div>

      {/* Q16: Additional Comments */}
      <div className="space-y-3">
        <label htmlFor="additionalComments" className="block font-semibold">
          Comentarios, agradecimientos, anécdotas?
        </label>
        <Textarea
          id="additionalComments"
          value={formData.additionalComments || ''}
          onChange={(e) => setAdditionalComments(e.target.value)}
          placeholder="Cualquier cosa que quieras compartir con nosotros..."
          rows={4}
          className="resize-none bg-muted/40"
        />
        <p className="text-muted-foreground text-sm">Opcional</p>
      </div>

      {/* Q17: Media Upload */}
      <div className="space-y-3">
        <p className="block font-semibold">
          Si tienes buenas fotos/videos del evento
        </p>
        <MediaUpload
          onFilesChange={setMediaUrls}
          currentUrls={formData.mediaUrls}
          maxFiles={5}
          prefix="feedback-media"
        />
        <p className="text-muted-foreground text-sm">Opcional</p>
      </div>

      {/* Q18: Feedback Usage Permission */}
      <div className="space-y-3">
        <p className="block font-semibold">
          ¿Podemos usar tu feedback para promoción?{' '}
          <span className="text-destructive">*</span>
        </p>
        <p className="text-muted-foreground text-sm">
          Por ejemplo, compartir citas en redes sociales o en el sponsor deck.
        </p>
        <div className="space-y-2">
          {[
            {
              value: 'yes_with_name',
              label: 'Sí, pueden usar mi feedback con mi nombre',
            },
            {
              value: 'yes_anonymous',
              label: 'Sí, pero de forma anónima',
            },
            {
              value: 'no',
              label: 'No, prefiero que no lo usen',
            },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                formData.feedbackUsagePermission === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-transparent hover:border-primary/30'
              }`}
            >
              <input
                type="radio"
                name="feedbackUsagePermission"
                value={option.value}
                checked={formData.feedbackUsagePermission === option.value}
                onChange={() =>
                  setFeedbackUsagePermission(
                    option.value as 'yes_with_name' | 'yes_anonymous' | 'no',
                  )
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
