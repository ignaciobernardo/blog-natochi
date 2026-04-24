'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import type { Hacker } from '@/src/lib/db/schema';
import { ConfettiEffect } from '../../../[publicId]/status/_components/confetti-effect';

interface OnboardingCompleteProps {
  hacker: Hacker;
}

export function OnboardingComplete({ hacker }: OnboardingCompleteProps) {
  const handleNavigateToDashboard = () => {
    window.location.href = '/hacker/dashboard';
  };

  return (
    <div className="min-h-screen bg-background">
      <ConfettiEffect />
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
              ¡Onboarding{' '}
              <span className="bg-primary px-2 py-1 text-background">
                Completo!
              </span>
            </h1>
            <p className="mt-4 font-mono text-primary/70 text-sm">
              Ya estás listo para Platanus Hack 25
            </p>
          </div>

          {/* Success Card */}
          <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full bg-green-500 p-6">
                  <CheckCircle2 className="h-16 w-16 text-white" />
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                  <h2 className="font-bold font-title text-2xl text-primary">
                    ¡Todo listo, {hacker.fullName.split(' ')[0]}!
                  </h2>
                  <p className="font-mono text-primary/70 text-sm">
                    Has completado todos los pasos del onboarding
                  </p>
                </div>
              </div>

              <div className="border-primary/20 border-t pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-mono text-sm">GitHub conectado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-mono text-sm">Discord conectado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-mono text-sm">
                      Créditos Anthropic registrados
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-mono text-sm">
                      Información completada
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={handleNavigateToDashboard}
                >
                  Ir al Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
