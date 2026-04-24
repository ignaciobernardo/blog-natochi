'use client';

import { Textarea } from '@/src/components/ui/textarea';
import { useFeedbackStore } from '@/src/store/feedback.store';

export function Improvement() {
  const { formData, setBestPart, setWorstPart, setSuggestions } =
    useFeedbackStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 font-bold text-2xl">Mejora continua</h2>
        <p className="text-muted-foreground">
          Tu feedback nos ayuda a mejorar futuras ediciones.
        </p>
      </div>

      {/* Q5: Best Part */}
      <div className="space-y-3">
        <label htmlFor="bestPart" className="block font-semibold">
          ¿Qué fue lo que más te gustó de la hack?{' '}
          <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="bestPart"
          value={formData.bestPart || ''}
          onChange={(e) => setBestPart(e.target.value)}
          placeholder="El ambiente, la comida, los mentores, el espacio..."
          rows={4}
          className="resize-none bg-muted/40"
        />
      </div>

      {/* Q6: Worst Part */}
      <div className="space-y-3">
        <label htmlFor="worstPart" className="block font-semibold">
          ¿Qué fue lo peor o más frustrante?
        </label>
        <Textarea
          id="worstPart"
          value={formData.worstPart || ''}
          onChange={(e) => setWorstPart(e.target.value)}
          placeholder="Algo que no te haya gustado o que te haya frustrado..."
          rows={4}
          className="resize-none bg-muted/40"
        />
        <p className="text-muted-foreground text-sm">Opcional</p>
      </div>

      {/* Q7: Suggestions */}
      <div className="space-y-3">
        <label htmlFor="suggestions" className="block font-semibold">
          ¿Qué cambiarías o agregarías para una futura edición?
        </label>
        <Textarea
          id="suggestions"
          value={formData.suggestions || ''}
          onChange={(e) => setSuggestions(e.target.value)}
          placeholder="Ideas, sugerencias, cosas que te gustaría ver..."
          rows={4}
          className="resize-none bg-muted/40"
        />
        <p className="text-muted-foreground text-sm">Opcional</p>
      </div>
    </div>
  );
}
