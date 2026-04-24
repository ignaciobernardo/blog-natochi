'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
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
import { joinWaitingListAction } from '../_actions/waiting-list-response.action';

interface WaitingListFormProps {
  publicId: string;
  submissionId: string;
  hackerName: string;
  isTeam: boolean;
  modality: SubmissionModality;
  hackerGender?: string | null;
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

export function WaitingListForm({
  publicId,
  submissionId,
  hackerName,
  isTeam,
  modality,
  hackerGender,
  teamMembers,
}: WaitingListFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPlural = modality === 'team';
  const isFemale = hackerGender === 'female';

  const handleJoin = async () => {
    setError(null);
    startTransition(async () => {
      const result = await joinWaitingListAction(submissionId, publicId);
      if (!result.success) {
        setError(result.error || 'Failed to join waiting list');
      } else {
        router.refresh();
      }
    });
  };

  const hasMultipleMembers = isTeam && teamMembers.length > 1;

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

      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8">
        <div className="space-y-6">
          <div className="border-primary/20 border-b pb-4">
            <h2 className="mb-2 font-bold font-title text-primary text-xl">
              Hola {hackerName.trim()}
              {hasMultipleMembers ? ' y equipo' : ''}
            </h2>
            <p className="font-mono text-primary/80 text-sm">
              Existe la posibilidad que equipos seleccionados cancelen su
              asistencia al evento a último minuto.
            </p>
          </div>

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
              Confirmación:
            </p>
            <p className="font-mono text-sm">
              {isPlural
                ? 'Al unirse a la lista de espera, el equipo confirma que todos sus miembros están dispuestos y disponibles para asistir el fin de semana completo (Viernes 21 de noviembre 18:30 hasta Domingo 23 de noviembre 15:30) a Platanus Hack 25.'
                : `Al unirte a la lista de espera, confirmas que estás ${isFemale ? 'dispuesta' : 'dispuesto'} y disponible para asistir el fin de semana completo (Viernes 21 de noviembre 18:30 hasta Domingo 23 de noviembre 15:30) a Platanus Hack 25.`}
            </p>
            <p className="mt-3 font-mono text-muted-foreground text-xs">
              {isPlural
                ? 'Si son seleccionados de la lista de espera, recibirán un correo electrónico con más información.'
                : `Si eres ${isFemale ? 'seleccionada' : 'seleccionado'} de la lista de espera, recibirás un correo electrónico con más información.`}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-center font-mono text-destructive text-sm">
                {error}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" size="lg" disabled={isPending}>
                  <Check className="mr-2 h-5 w-5" />
                  {isPlural
                    ? 'Sí, queremos unirnos a la lista de espera'
                    : 'Sí, quiero unirme a la lista de espera'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Confirmar Unión a Lista de Espera
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isPlural ? (
                      'Al confirmar, el equipo se une a la lista de espera de Platanus Hack 25. Todos los miembros confirman estar disponibles para asistir el fin de semana completo (Viernes 21 de noviembre 18:30 hasta Domingo 23 de noviembre 15:30) si son seleccionados.'
                    ) : (
                      <>
                        Al confirmar, te unes a la lista de espera de Platanus
                        Hack 25. Confirmas estar disponible para asistir el fin
                        de semana completo (Viernes 21 de noviembre 18:30 hasta
                        Domingo 23 de noviembre 15:30) si eres{' '}
                        {isFemale ? 'seleccionada' : 'seleccionado'}.
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleJoin} disabled={isPending}>
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
