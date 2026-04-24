'use client';

import { useEffect, useState } from 'react';
import { ConfettiEffect } from '@/app/(hack)/hacker/[publicId]/status/_components/confetti-effect';
import { useFeedbackStore } from '@/src/store/feedback.store';
import { NavigationButtons } from './_components/navigation-buttons';
import { ProgressBar } from './_components/progress-bar';
import { StepRouter } from './_components/step-router';

const FEEDBACK_PUBLIC_ID_KEY = 'platanus-hack-feedback-publicId';

interface MentorInfo {
  id: string;
  name: string | null;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function formatGithub(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/github\.com\/(.+)$/i);
  return match ? match[1].replace(/\/$/, '') : trimmed.replace(/^@/, '');
}

interface FeedbackPageClientProps {
  hackerProfileId: string;
  eventId: string;
  hackerName: string;
  hackerGithub: string | null;
  teamSlug: string | null;
  mentor: MentorInfo | null;
  projectName: string | null;
  feedbackPrizeDeadline: string | null;
}

function FeedbackPageClient({
  hackerProfileId,
  eventId,
  hackerName,
  hackerGithub,
  teamSlug,
  mentor,
  projectName,
  feedbackPrizeDeadline,
}: FeedbackPageClientProps) {
  const { currentStep, isSubmitted } = useFeedbackStore();
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!feedbackPrizeDeadline) {
      setCountdown(null);
      return;
    }

    const deadline = new Date(feedbackPrizeDeadline);
    if (Number.isNaN(deadline.getTime())) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown(null);
        return;
      }
      setCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [feedbackPrizeDeadline]);

  if (isSubmitted || currentStep === 'thank-you') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
        <ConfettiEffect />
        <div className="max-w-2xl text-center">
          <h1 className="mb-4 font-bold font-title text-3xl text-primary sm:text-4xl">
            Gracias por tu feedback, {hackerName.split(' ')[0]}!
          </h1>
          <p className="mb-6 text-lg text-muted-foreground">
            Nos vemos en Platanus Hack 26 👀
          </p>
        </div>
        <a
          href="/25"
          className="bg-primary px-6 py-3 font-bold text-background text-lg transition-all hover:scale-105"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pt-8 pb-8">
      {countdown && (
        <div className="mx-auto mb-4 w-full max-w-3xl px-4">
          <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-center font-medium text-primary text-sm">
            Te queda <span className="font-bold">{countdown}</span> para enviar
            tu feedback y participar por 50 USD
          </div>
        </div>
      )}
      <div className="mx-auto mb-6 w-full max-w-3xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm">
          <div className="text-foreground">
            {hackerName}{' '}
            {formatGithub(hackerGithub) && (
              <span className="font-bold">(@{formatGithub(hackerGithub)})</span>
            )}
          </div>
          {(teamSlug || projectName) && (
            <div className="text-muted-foreground">
              <span className="font-bold text-foreground">
                {teamSlug || 'sin-equipo'}
              </span>
              {projectName && (
                <span>
                  {' '}
                  | <span className="font-bold">{projectName}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <ProgressBar currentStep={currentStep} />

      <div className="flex-1 overflow-y-auto px-2 py-8">
        <StepRouter step={currentStep} mentor={mentor} />
      </div>

      <NavigationButtons
        currentStep={currentStep}
        hackerProfileId={hackerProfileId}
        eventId={eventId}
        hasMentor={!!mentor}
      />
    </div>
  );
}

export default function FeedbackPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const [data, setData] = useState<{
    hackerProfileId: string;
    eventId: string;
    hackerName: string;
    hackerGithub: string | null;
    teamSlug: string | null;
    alreadySubmitted: boolean;
    mentor: MentorInfo | null;
    projectName: string | null;
    feedbackPrizeDeadline: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { publicId } = await params;

        if (typeof window !== 'undefined') {
          const storedPublicId = window.localStorage.getItem(
            FEEDBACK_PUBLIC_ID_KEY,
          );
          if (storedPublicId !== publicId) {
            const { clearStorage, resetForm } = useFeedbackStore.getState();
            clearStorage();
            resetForm();
            window.localStorage.setItem(FEEDBACK_PUBLIC_ID_KEY, publicId);
          }
        }

        const response = await fetch(
          `/api/feedback/check?publicId=${publicId}`,
        );
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Error al cargar los datos');
          return;
        }

        setData(result);
      } catch {
        setError('Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">
          Cargando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="max-w-2xl text-center">
          <h1 className="mb-4 font-bold font-title text-3xl text-destructive">
            Error
          </h1>
          <p className="mb-6 text-lg text-muted-foreground">{error}</p>
        </div>
        <a
          href="/25"
          className="bg-primary px-6 py-3 font-bold text-background text-lg transition-all hover:scale-105"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="max-w-2xl text-center">
          <h1 className="mb-4 font-bold font-title text-3xl text-destructive">
            No encontrado
          </h1>
          <p className="mb-6 text-lg text-muted-foreground">
            No se encontró el perfil del hacker.
          </p>
        </div>
        <a
          href="/25"
          className="bg-primary px-6 py-3 font-bold text-background text-lg transition-all hover:scale-105"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  if (data.alreadySubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="max-w-2xl text-center">
          <h1 className="mb-4 font-bold font-title text-3xl text-primary">
            ¡Ya enviaste tu feedback!
          </h1>
          <p className="mb-6 text-lg text-muted-foreground">
            Gracias por compartir tu opinión sobre Platanus Hack 25.
          </p>
        </div>
        <a
          href="/25"
          className="bg-primary px-6 py-3 font-bold text-background text-lg transition-all hover:scale-105"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <FeedbackPageClient
      hackerProfileId={data.hackerProfileId}
      eventId={data.eventId}
      hackerName={data.hackerName}
      hackerGithub={data.hackerGithub}
      teamSlug={data.teamSlug}
      mentor={data.mentor}
      projectName={data.projectName}
      feedbackPrizeDeadline={data.feedbackPrizeDeadline}
    />
  );
}
