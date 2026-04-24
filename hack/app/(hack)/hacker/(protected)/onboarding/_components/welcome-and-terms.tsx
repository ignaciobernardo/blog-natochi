'use client';

import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import type { Hacker } from '@/src/lib/db/schema';
import { TermsStep } from './terms-step';

interface WelcomeAndTermsProps {
  hacker: Hacker;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function WelcomeAndTerms({ hacker, user }: WelcomeAndTermsProps) {
  const [showTerms, setShowTerms] = useState(false);
  const githubUsername = hacker.github?.split('/').pop() || '';
  const githubProfileUrl = `https://github.com/${githubUsername}`;
  const githubAvatarUrl =
    user.image || `https://github.com/${githubUsername}.png`;

  if (showTerms) {
    return <TermsStep />;
  }

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
              ¡Bienvenido{' '}
              <span className="bg-primary px-2 py-1 text-background">
                {user.name.split(' ')[0]}!
              </span>
            </h1>
            <p className="mt-4 font-mono text-primary/70 text-sm">
              Tu cuenta de GitHub ha sido conectada exitosamente
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
                  Para continuar con el onboarding, necesitas aceptar las bases
                  del hackathon.
                </p>
              </div>

              {/* Continue Button */}
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => setShowTerms(true)}
                >
                  Continuar al siguiente paso
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
