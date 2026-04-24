'use client';

import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import type { Hacker } from '@/src/lib/db/schema';

interface GithubSuccessViewProps {
  hacker: Hacker;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function GithubSuccessView({ hacker, user }: GithubSuccessViewProps) {
  const githubUsername = hacker.github?.split('/').pop() || '';
  const githubProfileUrl = `https://github.com/${githubUsername}`;
  const githubAvatarUrl =
    user.image || `https://github.com/${githubUsername}.png`;

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
              ¡GitHub{' '}
              <span className="bg-primary px-2 py-1 text-background">
                Conectado!
              </span>
            </h1>
            <p className="mt-4 font-mono text-primary/70 text-sm">
              Tu cuenta ha sido conectada exitosamente
            </p>
          </div>

          {/* Success Card */}
          <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
            <div className="space-y-6">
              {/* Success Alert */}
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">
                  ¡Cuenta conectada exitosamente!
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  Tu cuenta de GitHub se ha vinculado correctamente.
                </AlertDescription>
              </Alert>

              {/* Profile Info */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Image
                    src={githubAvatarUrl}
                    alt={`${githubUsername} avatar`}
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-green-500"
                  />
                  <div className="absolute right-0 bottom-0 rounded-full bg-green-500 p-2">
                    <svg
                      className="h-6 w-6 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                  <h2 className="font-bold font-title text-3xl text-primary">
                    {user.name}
                  </h2>
                  <p className="font-mono text-primary/70 text-sm">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* GitHub Info */}
              <div className="border-primary/20 border-t pt-6">
                <div className="bg-green-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold font-title text-green-800">
                      Usuario de GitHub:
                    </span>
                    <a
                      href={githubProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-green-700 transition-colors hover:underline"
                    >
                      @{githubUsername}
                    </a>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="border-primary/20 border-t pt-6">
                <h3 className="mb-4 font-bold font-title text-primary text-xl">
                  Siguiente paso
                </h3>
                <p className="mb-4 font-mono text-primary/80 text-sm">
                  Para completar tu onboarding, conecta tu cuenta de Discord
                  para unirte al servidor del hackathon.
                </p>
              </div>

              {/* Discord Connect Button */}
              <div className="flex justify-center pt-4">
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href="/hacker/onboarding">
                    <svg
                      className="mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Conectar Discord
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
