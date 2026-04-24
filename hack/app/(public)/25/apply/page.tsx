'use client';

import { useEffect, useState } from 'react';
import { useApplicationStore } from '@/src/store/application.store';
import { NavigationButtons } from './_components/navigation-buttons';
import { ProgressBar } from './_components/progress-bar';
import { StepRouter } from './_components/step-router';

export default function ApplyPage() {
  const { currentStep } = useApplicationStore();
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkDeadline = () => {
      const eventDate = new Date('2025-11-11T00:10:00-03:00').getTime();
      const now = Date.now();
      setIsExpired(now > eventDate);
    };

    checkDeadline();
    const timer = setInterval(checkDeadline, 1000);
    return () => clearInterval(timer);
  }, []);

  if (isExpired) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="max-w-2xl text-center">
          <h1 className="mb-4 font-bold font-title text-4xl text-primary sm:text-5xl md:text-6xl">
            Postulaciones Cerradas
          </h1>
          <p className="mb-6 font-title text-lg text-primary/80 sm:text-xl">
            Las postulaciones cerraron el lunes 10 de noviembre, 23:59 CLT.
          </p>
          <p className="font-title text-base text-primary/70 sm:text-lg">
            ¿Dudas? Contáctanos en{' '}
            <a
              href="mailto:hack@platan.us"
              className="font-bold text-primary underline hover:text-primary/80"
            >
              hack@platan.us
            </a>
          </p>
        </div>
        <a
          href="/25"
          className="mt-4 bg-primary px-6 py-3 font-bold font-title text-background text-lg transition-all hover:scale-105"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col pt-8 pb-8">
      <ProgressBar currentStep={currentStep} />

      <div className="flex-1 overflow-y-auto px-2 py-8">
        <StepRouter step={currentStep} />
      </div>

      <NavigationButtons currentStep={currentStep} />
    </div>
  );
}
