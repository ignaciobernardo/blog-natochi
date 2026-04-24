'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import type { FeedbackStep } from '@/src/store/feedback.store';
import { useFeedbackStore } from '@/src/store/feedback.store';
import { submitFeedbackAction } from '../_actions/submit-feedback.action';

interface NavigationButtonsProps {
  currentStep: FeedbackStep;
  hackerProfileId: string;
  eventId: string;
  hasMentor: boolean;
}

export function NavigationButtons({
  currentStep,
  hackerProfileId,
  eventId,
  hasMentor,
}: NavigationButtonsProps) {
  const {
    previousStep,
    nextStep,
    canGoBack,
    formData,
    setIsLoading,
    setError,
    setIsSubmitted,
    clearStorage,
  } = useFeedbackStore();
  const [isLoading, setLocalLoading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);

  const isStepComplete = (): boolean => {
    switch (currentStep) {
      case 'overall':
        return (
          formData.overallRating !== undefined &&
          formData.overallRating >= 1 &&
          formData.npsScore !== undefined &&
          formData.npsScore >= 0 &&
          formData.participationIntent !== undefined
        );

      case 'quality': {
        const ratings = formData.eventQualityRatings;
        return Object.values(ratings).every((v) => v >= 1 && v <= 5);
      }

      case 'improvement':
        return !!formData.bestPart && formData.bestPart.length > 0;

      case 'sponsors':
        return (
          !!formData.sponsorUnaidedRecall &&
          formData.sponsorUnaidedRecall.length > 0
        );

      case 'future':
        return formData.startupIntent !== undefined;

      case 'extras':
        return formData.feedbackUsagePermission !== undefined;

      case 'thank-you':
        return true;

      default:
        return true;
    }
  };

  const handleBack = () => {
    if (canGoBack()) {
      previousStep();
    }
  };

  const handleContinue = async () => {
    setLocalError(null);

    if (!isStepComplete()) {
      setLocalError('Por favor completa todos los campos requeridos');
      return;
    }

    if (currentStep === 'extras') {
      // Validate required fields before submission
      if (
        formData.overallRating === undefined ||
        formData.npsScore === undefined ||
        !formData.participationIntent ||
        !formData.bestPart ||
        !formData.sponsorUnaidedRecall ||
        !formData.startupIntent ||
        !formData.feedbackUsagePermission
      ) {
        setLocalError('Por favor completa todos los campos requeridos');
        return;
      }

      setLocalLoading(true);
      setIsLoading(true);

      try {
        const result = await submitFeedbackAction({
          hackerProfileId,
          eventId,
          formData: {
            overallRating: formData.overallRating,
            npsScore: formData.npsScore,
            participationIntent: formData.participationIntent,
            eventQualityRatings: formData.eventQualityRatings,
            bestPart: formData.bestPart,
            worstPart: formData.worstPart || undefined,
            suggestions: formData.suggestions || undefined,
            sponsorUnaidedRecall: formData.sponsorUnaidedRecall,
            sponsorsInteracted: formData.sponsorsInteracted || undefined,
            sponsorWorkIntent: formData.sponsorWorkIntent || undefined,
            sponsorComments: formData.sponsorComments || undefined,
            startupIntent: formData.startupIntent,
            fundingPreference: formData.fundingPreference || undefined,
            startupAmbition: formData.startupAmbition || undefined,
            howHeardAbout: formData.howHeardAbout || undefined,
            additionalComments: formData.additionalComments || undefined,
            mediaUrls: formData.mediaUrls || undefined,
            feedbackUsagePermission: formData.feedbackUsagePermission,
            mentorRating: hasMentor ? formData.mentorRating : undefined,
          },
        });

        if (result.success) {
          clearStorage();
          setIsSubmitted(true);
          nextStep();
        } else {
          setLocalError(result.error || 'Error al enviar el feedback');
          setError(result.error || 'Error al enviar el feedback');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error al enviar el feedback';
        setLocalError(errorMessage);
        setError(errorMessage);
      } finally {
        setLocalLoading(false);
        setIsLoading(false);
      }
    } else {
      nextStep();
    }
  };

  const isFinalStep = currentStep === 'extras';
  const isThankYouStep = currentStep === 'thank-you';

  if (isThankYouStep) {
    return null;
  }

  return (
    <div className="space-y-3 border-border border-t pt-8">
      {error && (
        <div className="rounded border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        {canGoBack() && (
          <Button variant="outline" onClick={handleBack} disabled={isLoading}>
            ← Atras
          </Button>
        )}

        <div className="flex-1" />

        <Button
          onClick={handleContinue}
          disabled={isLoading || !isStepComplete()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted"
        >
          {isLoading ? (
            <>
              <span className="mr-2 animate-spin">⏳</span>
              {isFinalStep ? 'Enviando...' : 'Cargando...'}
            </>
          ) : isFinalStep ? (
            'Enviar feedback'
          ) : (
            'Continuar →'
          )}
        </Button>
      </div>
    </div>
  );
}
