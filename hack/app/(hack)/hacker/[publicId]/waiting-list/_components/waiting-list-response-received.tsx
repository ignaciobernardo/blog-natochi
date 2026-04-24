import { Check } from 'lucide-react';
import type { SubmissionModality } from '@/src/lib/db/schema';

interface WaitingListResponseReceivedProps {
  modality: SubmissionModality;
}

export function WaitingListResponseReceived({
  modality,
}: WaitingListResponseReceivedProps) {
  const isPlural = modality === 'team';

  const message = isPlural
    ? 'Gracias por unirse a la lista de espera. Si un lugar se libera, todos los miembros del equipo recibirán un correo electrónico con más información.'
    : 'Gracias por unirte a la lista de espera. Si un lugar se libera, recibirás un correo electrónico con más información.';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
          <span className="bg-primary px-2 py-1 text-background">
            Lista de Espera
          </span>
        </h1>
        <p className="font-mono text-muted-foreground text-sm">
          Platanus Hack 25
        </p>
      </div>

      <div className="border-2 border-primary bg-background/80 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
          <Check className="h-10 w-10 text-background" />
        </div>
        <h2 className="mb-4 font-bold font-title text-2xl text-primary sm:text-3xl">
          {isPlural ? 'Equipo en Lista de Espera' : 'En Lista de Espera'}
        </h2>
        <p className="font-mono text-primary/80">{message}</p>
      </div>

      <div className="text-center">
        <a
          href="/25"
          className="inline-block font-mono text-muted-foreground text-sm underline transition-colors hover:text-primary"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
