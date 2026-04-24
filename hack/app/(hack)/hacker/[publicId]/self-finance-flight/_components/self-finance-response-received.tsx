import { Check, X } from 'lucide-react';
import type { SubmissionModality, SubmissionStatus } from '@/src/lib/db/schema';

interface SelfFinanceResponseReceivedProps {
  currentStatus: SubmissionStatus;
  modality: SubmissionModality;
}

export function SelfFinanceResponseReceived({
  currentStatus,
  modality,
}: SelfFinanceResponseReceivedProps) {
  const isApproved = currentStatus === 'approved';
  const isRejected = currentStatus === 'rejected';
  const isPlural = modality === 'team';

  const Icon = isApproved ? Check : X;
  const bgColor = isApproved ? 'bg-primary' : 'bg-destructive';
  const borderColor = isApproved ? 'border-primary' : 'border-destructive';
  const textColor = isApproved ? 'text-primary' : 'text-destructive';
  const iconColor = isApproved ? 'text-background' : 'text-white';

  let title = 'Respuesta Recibida';
  let message = `Gracias por ${isPlural ? 'su' : 'tu'} respuesta. ${isPlural ? 'Los' : 'Te'} contactaremos pronto con más información.`;

  if (isApproved) {
    title = isPlural ? 'Equipo Aprobado' : 'Postulación Aprobada';
    if (isPlural) {
      message =
        'Gracias por confirmar que el equipo puede financiar su viaje. La postulación del equipo ha sido aprobada. Todos los miembros recibirán un correo con los siguientes pasos para confirmar su asistencia a Platanus Hack 25.';
    } else {
      message =
        'Gracias por confirmar que puedes financiar tu viaje. Tu postulación ha sido aprobada. Recibirás un correo con los siguientes pasos para confirmar tu asistencia a Platanus Hack 25.';
    }
  } else if (isRejected) {
    title = 'Respuesta Recibida';
    if (isPlural) {
      message =
        'Gracias por su respuesta. Lamentamos que el equipo no pueda financiar su viaje. La postulación del equipo ha sido rechazada. Todos los miembros recibirán un correo con más información.';
    } else {
      message =
        'Gracias por tu respuesta. Lamentamos que no puedas financiar tu viaje. Tu postulación ha sido rechazada. Recibirás un correo con más información.';
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
          <span className="bg-primary px-2 py-1 text-background">
            Confirmación de Viaje
          </span>
        </h1>
        <p className="font-mono text-muted-foreground text-sm">
          Platanus Hack 25
        </p>
      </div>

      <div
        className={`border-2 ${borderColor} bg-background/80 p-8 text-center backdrop-blur-sm`}
      >
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${bgColor}`}
        >
          <Icon className={`h-10 w-10 ${iconColor}`} />
        </div>
        <h2
          className={`mb-4 font-bold font-title text-2xl ${textColor} sm:text-3xl`}
        >
          {title}
        </h2>
        <p
          className={`font-mono ${isRejected ? textColor : 'text-primary/80'}`}
        >
          {message}
        </p>
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
