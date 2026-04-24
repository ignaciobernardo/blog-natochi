'use client';

import { AlertCircle, Github } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import { authClient } from '@/src/lib/auth-client';
import type { Hacker } from '@/src/lib/db/schema';

interface OnboardWelcomeProps {
  hacker: Hacker;
}

export function OnboardWelcome({ hacker }: OnboardWelcomeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const welcomeMessage =
    hacker.gender === 'female' ? 'Bienvenida' : 'Bienvenido';
  const githubUsername = hacker.github?.split('/').pop() || '';

  useEffect(() => {
    if (error) {
      const errorMessages: Record<string, string> = {
        unauthorized: 'No estás autorizado para acceder a esta cuenta.',
        unable_to_link_account: `La cuenta de GitHub que intentaste conectar no coincide con @${githubUsername}. Por favor, inicia sesión con la cuenta correcta.`,
      };

      const message =
        errorMessages[error] ||
        'Ocurrió un error al conectar tu cuenta de GitHub.';
      toast.error(message);
    }
  }, [error, githubUsername]);

  const handleGithubConnect = async () => {
    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/hacker/onboarding',
        errorCallbackURL: `/hacker/${hacker.publicId}/onboard?error=unauthorized`,
      });
    } catch (error) {
      toast.error('Error al conectar con GitHub');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container relative mx-auto px-4 py-12 md:py-16">
        {/* Platanus logo in top right */}
        <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6 md:top-8 md:right-8">
          <div
            className="aspect-[576/112] h-7 w-auto sm:h-9 md:h-10"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              maskImage: 'url(/assets/logos/platanus.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: 'url(/assets/logos/platanus.svg)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
            }}
          />
        </div>

        {/* Main content */}
        <div className="mx-auto w-full max-w-4xl space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="inline-block font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              {welcomeMessage}{' '}
              <span className="bg-primary px-2 py-1 text-background">
                {hacker.fullName}
              </span>
            </h1>
            <p className="mt-4 font-mono text-primary/70 text-sm">
              Bienvenid{hacker.gender === 'female' ? 'a' : 'o'} a Platanus Hack
              25
            </p>
          </div>

          {/* Onboarding Card */}
          <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
            <div className="space-y-6">
              {/* Header */}
              <div className="border-primary/20 border-b pb-4">
                <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl">
                  Conecta tu cuenta
                </h2>
                <p className="mt-2 font-mono text-primary/80 text-sm">
                  Antes de que puedas ingresar al evento, debemos conectar
                  algunas cuentas y rellenar un poco de información adicional.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error de autenticación</AlertTitle>
                  <AlertDescription>
                    {error === 'unable_to_link_account'
                      ? `La cuenta de GitHub que intentaste conectar no coincide con @${githubUsername}. Por favor, inicia sesión con la cuenta correcta.`
                      : error === 'unauthorized'
                        ? 'No estás autorizado para acceder a esta cuenta.'
                        : 'Ocurrió un error al conectar tu cuenta de GitHub. Inténtalo nuevamente.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* GitHub Connection */}
              <div className="bg-primary/10 p-6">
                <p className="mb-4 font-bold font-title text-primary">
                  Comencemos por agregar tu cuenta de GitHub
                </p>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    {hacker.github && (
                      <Image
                        src={`https://github.com/${githubUsername}.png`}
                        alt={`${githubUsername} avatar`}
                        width={64}
                        height={64}
                        className="rounded-full border-2 border-primary"
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <p className="font-bold font-mono text-lg text-primary">
                        @{githubUsername || 'GitHub no configurado'}
                      </p>
                      {hacker.github && (
                        <a
                          href={hacker.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-primary/70 text-sm transition-colors hover:text-primary hover:underline"
                        >
                          {hacker.github}
                        </a>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleGithubConnect}
                    disabled={isLoading || !hacker.github}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Github className="mr-2 h-5 w-5" />
                    {isLoading ? 'Conectando...' : 'Conectar'}
                  </Button>
                </div>

                {!hacker.github && (
                  <p className="mt-4 text-destructive text-sm">
                    No tienes una cuenta de GitHub configurada. Por favor
                    contacta a los organizadores.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
