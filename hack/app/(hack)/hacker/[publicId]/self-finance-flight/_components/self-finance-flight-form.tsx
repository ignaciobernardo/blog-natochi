'use client';

import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import type { SubmissionModality } from '@/src/lib/db/schema';
import {
  acceptSelfFinanceTripAction,
  rejectSelfFinanceTripAction,
} from '../_actions/self-finance-response.action';

interface SelfFinanceFlightFormProps {
  publicId: string;
  submissionId: string;
  deadline: Date;
  hackerName: string;
  isTeam: boolean;
  modality: SubmissionModality;
  teamMembers: Array<{
    id: string;
    fullName: string;
    github: string | null;
  }>;
}

function extractGithubUsername(github: string | null): string {
  if (!github) return '';
  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }
  return github;
}

export function SelfFinanceFlightForm({
  publicId,
  submissionId,
  deadline,
  hackerName,
  isTeam,
  modality,
  teamMembers,
}: SelfFinanceFlightFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPlural = modality === 'team';

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const deadlineTime = deadline.getTime();
      const difference = deadlineTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        return null;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const handleAccept = async () => {
    setError(null);
    startTransition(async () => {
      const result = await acceptSelfFinanceTripAction(submissionId, publicId);
      if (!result.success) {
        setError(result.error || 'Failed to accept self-finance trip');
      } else {
        router.refresh();
      }
    });
  };

  const handleReject = async () => {
    setError(null);
    startTransition(async () => {
      const result = await rejectSelfFinanceTripAction(submissionId, publicId);
      if (!result.success) {
        setError(result.error || 'Failed to reject self-finance trip');
      } else {
        router.refresh();
      }
    });
  };

  const hasMultipleMembers = isTeam && teamMembers.length > 1;

  if (isExpired) {
    return (
      <div className="border-2 border-destructive bg-background/80 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive">
          <X className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-4 font-bold font-title text-2xl text-destructive sm:text-3xl">
          Plazo Vencido
        </h1>
        <p className="font-mono text-muted-foreground">
          El plazo para responder a esta solicitud ha expirado.
        </p>
      </div>
    );
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

      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8">
        <div className="space-y-6">
          <div className="border-primary/20 border-b pb-4">
            <h2 className="mb-2 font-bold font-title text-primary text-xl">
              Hola {hackerName}
              {hasMultipleMembers ? ' y equipo' : ''}
            </h2>
            <p className="font-mono text-primary/80 text-sm">
              Nos encantaría que participaras en Platanus Hack 25, pero debido a
              cupos limitados, no podemos cubrir los pasajes a Chile.
            </p>
          </div>

          {timeLeft && (
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
              <div className="mb-2 text-center font-bold font-title text-primary text-sm">
                Tiempo restante para responder:
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="font-bold font-title text-3xl text-primary">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="font-mono text-muted-foreground text-xs">
                    horas
                  </div>
                </div>
                <div className="font-bold font-title text-3xl text-primary">
                  :
                </div>
                <div className="text-center">
                  <div className="font-bold font-title text-3xl text-primary">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="font-mono text-muted-foreground text-xs">
                    minutos
                  </div>
                </div>
                <div className="font-bold font-title text-3xl text-primary">
                  :
                </div>
                <div className="text-center">
                  <div className="font-bold font-title text-3xl text-primary">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="font-mono text-muted-foreground text-xs">
                    segundos
                  </div>
                </div>
              </div>
            </div>
          )}

          {teamMembers.length > 0 && (
            <div>
              <h3 className="mb-3 font-bold font-title text-primary">
                {hasMultipleMembers ? 'Miembros del equipo:' : 'Participante:'}
              </h3>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="border-primary border-l-4 pl-3 font-mono text-primary/80 text-sm"
                  >
                    {member.fullName}
                    {member.github && (
                      <span className="ml-2 text-primary/60">
                        (@{extractGithubUsername(member.github)})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4">
            <p className="mb-2 font-bold font-title text-primary text-sm">
              La pregunta es:
            </p>
            <p className="font-mono text-sm">
              {isPlural
                ? '¿El equipo puede financiar su viaje a Chile para asistir a Platanus Hack 25 (21-23 de noviembre)?'
                : '¿Puedes financiar tu viaje a Chile para asistir a Platanus Hack 25 (21-23 de noviembre)?'}
            </p>
            {isPlural && (
              <p className="mt-2 font-mono text-muted-foreground text-xs">
                Esta decisión aplica para todos los miembros del equipo.
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-center font-mono text-destructive text-sm">
                {error}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="flex-1"
                  size="lg"
                  disabled={isPending || isExpired}
                >
                  <Check className="mr-2 h-5 w-5" />
                  Sí, {isPlural ? 'podemos' : 'puedo'} financiar{' '}
                  {isPlural ? 'nuestro' : 'mi'} viaje
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Aceptación</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isPlural ? (
                      <>
                        Al confirmar, el equipo se compromete a financiar su
                        viaje a Chile para asistir a Platanus Hack 25. Todos los
                        miembros recibirán un correo de confirmación con los
                        siguientes pasos y la postulación del equipo será{' '}
                        <strong>aprobada</strong>.
                      </>
                    ) : (
                      <>
                        Al confirmar, te comprometes a financiar tu viaje a
                        Chile para asistir a Platanus Hack 25. Recibirás un
                        correo de confirmación con los siguientes pasos y tu
                        postulación será <strong>aprobada</strong>.
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAccept}
                    disabled={isPending}
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  disabled={isPending || isExpired}
                >
                  <X className="mr-2 h-5 w-5" />
                  No {isPlural ? 'podemos' : 'puedo'} financiar{' '}
                  {isPlural ? 'nuestro' : 'mi'} viaje
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Rechazo</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isPlural ? (
                      <>
                        Lamentamos que el equipo no pueda financiar su viaje. Al
                        confirmar, la postulación del equipo será{' '}
                        <strong>rechazada</strong> y no podrán asistir a
                        Platanus Hack 25. Esto es debido a que no tenemos cupos
                        disponibles para cubrir los costos de viaje.
                      </>
                    ) : (
                      <>
                        Lamentamos que no puedas financiar tu viaje. Al
                        confirmar, tu postulación será{' '}
                        <strong>rechazada</strong> y no podrás asistir a
                        Platanus Hack 25. Esto es debido a que no tenemos cupos
                        disponibles para cubrir los costos de viaje.
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReject}
                    disabled={isPending}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
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
