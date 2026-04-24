'use client';

import { useEffect, useRef, useState } from 'react';
import { decodeApplicationPrefill } from '@/src/lib/utils/application-prefill';
import { useApplicationStore } from '@/src/store/application.store';
import { NavigationButtons } from './navigation-buttons';
import { ProgressBar } from './progress-bar';
import { StepRouter } from './step-router';

interface ApplyPageClientProps {
  eventName: string;
  finalDeadlineAtIso: string | null;
  prefillQuery: string | null;
}

function formatDeadline(date: Date) {
  return `${new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date)} ART`;
}

export function ApplyPageClient({
  eventName,
  finalDeadlineAtIso,
  prefillQuery,
}: ApplyPageClientProps) {
  const {
    currentStep,
    formData,
    setModality,
    nextStep,
    hydrateApplication,
    isHydrated,
  } = useApplicationStore();
  const [isExpired, setIsExpired] = useState(false);
  const hasAppliedPrefill = useRef(false);

  useEffect(() => {
    if (!isHydrated || hasAppliedPrefill.current || !prefillQuery) {
      return;
    }

    hasAppliedPrefill.current = true;

    const prefillingData = decodeApplicationPrefill(prefillQuery);
    if (!prefillingData) {
      return;
    }

    hydrateApplication(prefillingData);

    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    window.history.replaceState(window.history.state, '', url.toString());
  }, [hydrateApplication, isHydrated, prefillQuery]);

  useEffect(() => {
    if (currentStep === 'welcome-1') {
      nextStep();
    }
  }, [currentStep, nextStep]);

  useEffect(() => {
    if (formData.modality !== 'team') {
      setModality('team');
    }
  }, [formData.modality, setModality]);

  useEffect(() => {
    if (currentStep === 'modality') {
      nextStep();
    }
  }, [currentStep, nextStep]);

  useEffect(() => {
    if (!finalDeadlineAtIso) {
      setIsExpired(false);
      return;
    }

    const eventDate = new Date(finalDeadlineAtIso).getTime();

    const checkDeadline = () => {
      const now = Date.now();
      setIsExpired(now > eventDate);
    };

    checkDeadline();
    const timer = setInterval(checkDeadline, 1000);
    return () => clearInterval(timer);
  }, [finalDeadlineAtIso]);

  if (isExpired) {
    const closedAt = finalDeadlineAtIso
      ? formatDeadline(new Date(finalDeadlineAtIso))
      : null;

    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-6 px-4">
        <div className="max-w-2xl text-center">
          <h1 className="mb-4 font-bold font-title text-4xl text-primary sm:text-5xl md:text-6xl">
            Postulaciones Cerradas
          </h1>
          {closedAt && (
            <p className="mb-6 font-title text-lg text-primary/80 sm:text-xl">
              Las postulaciones para {eventName} cerraron el {closedAt}.
            </p>
          )}
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
          href="/26-ar"
          className="mt-4 bg-primary px-6 py-3 font-bold font-title text-background text-lg transition-all hover:scale-105"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col pt-8 pb-8">
      <ProgressBar currentStep={currentStep} />

      <div className="flex-1 overflow-y-auto px-2 py-8">
        <StepRouter step={currentStep} eventName={eventName} />
      </div>

      <NavigationButtons currentStep={currentStep} />
    </div>
  );
}
