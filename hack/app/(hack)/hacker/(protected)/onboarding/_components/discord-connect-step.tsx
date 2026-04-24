'use client';

import { AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';

interface DiscordConnectStepProps {
  discordOAuthUrl: string;
}

export function DiscordConnectStep({
  discordOAuthUrl,
}: DiscordConnectStepProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

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
        <div className="mx-auto w-full max-w-2xl space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="inline-block font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              Conectar{' '}
              <span className="bg-primary px-2 py-1 text-background">
                Discord
              </span>
            </h1>
            <p className="mt-4 font-mono text-primary/70 text-sm">
              Únete al servidor del hackathon
            </p>
          </div>

          {/* Connect Card */}
          <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
            <div className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertTitle className="text-red-800">
                    Error al conectar Discord
                  </AlertTitle>
                  <AlertDescription className="text-red-700">
                    {error === 'missing_code' &&
                      'Código de autorización faltante.'}
                    {error === 'not_authenticated' && 'No estás autenticado.'}
                    {error === 'invalid_profile' && 'Perfil inválido.'}
                    {error === 'connection_failed' &&
                      'Error al conectar con Discord. Por favor, intenta nuevamente.'}
                    {![
                      'missing_code',
                      'not_authenticated',
                      'invalid_profile',
                      'connection_failed',
                    ].includes(error) && `Error: ${error}`}
                  </AlertDescription>
                </Alert>
              )}

              {/* Discord Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="rounded-full bg-[#5865F2] p-8">
                    <svg
                      className="h-16 w-16 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </div>
                  {/* Server Icon Overlapped */}
                  <div className="-bottom-2 -right-2 absolute rounded-full border-4 border-background bg-white p-1">
                    <Image
                      src="/assets/images/misc/discord-server-icon.png"
                      alt="Platanus Hack Discord Server"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-4 text-center">
                <h3 className="font-bold font-title text-primary text-xl">
                  Conecta tu cuenta de Discord
                </h3>
                <p className="font-mono text-primary/80 text-sm">
                  Discord es el medio de comunicación oficial durante la hack.
                  Debes estar ahí para recibir toda la información importante.
                  (Y también interactuar con hackers, mentores y sponsors)
                </p>
              </div>

              {/* Connect Button */}
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] sm:w-auto"
                  onClick={() => {
                    window.location.href = discordOAuthUrl;
                  }}
                >
                  <div className="mr-2 flex items-center gap-1.5">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <Image
                      src="/assets/images/misc/discord-server-icon.png"
                      alt="Discord Server"
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded"
                    />
                  </div>
                  Conectar Discord
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
