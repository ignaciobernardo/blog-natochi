'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  GITHUB_PROFILE_URL_MESSAGE,
  isValidGitHubProfileUrl,
  isValidLinkedInProfileUrl,
  LINKEDIN_PROFILE_URL_MESSAGE,
} from '@/src/lib/validations/social-profiles';
import { useApplicationStore } from '@/src/store/application.store';

interface NavigationButtonsProps {
  currentStep: string;
  onContinue?: () => void | Promise<void>;
  onBack?: () => void;
}

export function NavigationButtons({
  currentStep,
  onContinue,
  onBack,
}: NavigationButtonsProps) {
  const { previousStep, nextStep, canGoBack, formData } = useApplicationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (canGoBack()) {
      if (currentStep === 'team-status') {
        previousStep(); // team-status -> modality
        previousStep(); // modality -> welcome-2
        return;
      }
      previousStep();
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isStepComplete = (): boolean => {
    // Check if current step has all required fields filled
    if (currentStep === 'modality') {
      return true;
    }

    if (currentStep === 'team-status') {
      return !!formData.teamStatus;
    }

    if (currentStep === 'team-size') {
      return !!formData.teamSize;
    }

    if (currentStep.includes('member-personal')) {
      const memberIndex = parseInt(currentStep.split('-')[2]) - 1;
      const member = formData.members[memberIndex];
      return !!(
        member?.fullName &&
        member?.country &&
        member?.email &&
        member?.githubProfile &&
        member?.linkedinProfile &&
        member?.age &&
        validateEmail(member.email) &&
        isValidGitHubProfileUrl(member.githubProfile) &&
        isValidLinkedInProfileUrl(member.linkedinProfile)
      );
    }

    if (currentStep.includes('member-builder')) {
      const memberIndex = parseInt(currentStep.split('-')[2]) - 1;
      const member = formData.members[memberIndex];
      return !!(
        member?.builderDescription && member.builderDescription.length >= 20
      );
    }

    if (currentStep.includes('member-education')) {
      const memberIndex = parseInt(currentStep.split('-')[2]) - 1;
      const member = formData.members[memberIndex];
      return !!(member?.education && member.education.length >= 20);
    }

    if (currentStep.includes('member-role')) {
      const memberIndex = parseInt(currentStep.split('-')[2]) - 1;
      const member = formData.members[memberIndex];
      return !!(member?.roles && member.roles.length > 0);
    }

    if (currentStep.includes('member-veteran')) {
      const memberIndex = parseInt(currentStep.split('-')[2]) - 1;
      const member = formData.members[memberIndex];
      // If veteran, must have previousHackathons filled
      if (member?.isVeteran === true) {
        return !!member?.previousHackathons;
      }
      // isVeteran must be explicitly set (true or false, not undefined)
      return typeof member?.isVeteran === 'boolean';
    }

    if (currentStep.includes('member-considerations')) {
      const memberIndex = parseInt(currentStep.split('-')[2]) - 1;
      const member = formData.members[memberIndex];
      return !!(member?.shirtSize && member?.diet);
    }

    if (currentStep === 'suggestions') {
      return !!formData.eventSuggestions;
    }

    // Other steps (welcome, intro, team-ready, etc.) don't have required fields
    return true;
  };

  const validateCurrentStep = (): boolean => {
    setError(null);

    // Validation based on current step
    if (currentStep === 'team-status' && !formData.teamStatus) {
      setError('Please select team status');
      return false;
    }

    if (currentStep === 'team-size' && !formData.teamSize) {
      setError('Please select team size');
      return false;
    }

    if (currentStep.includes('member-personal')) {
      const memberIndex = parseInt(currentStep.split('-')[2]) - 1;
      const member = formData.members[memberIndex];

      if (
        !member?.fullName ||
        !member?.email ||
        !member?.githubProfile ||
        !member?.linkedinProfile
      ) {
        setError('Please fill in all required fields');
        return false;
      }

      if (!validateEmail(member.email)) {
        setError('Please enter a valid email address');
        return false;
      }

      if (!isValidGitHubProfileUrl(member.githubProfile)) {
        setError(GITHUB_PROFILE_URL_MESSAGE);
        return false;
      }

      if (!isValidLinkedInProfileUrl(member.linkedinProfile)) {
        setError(LINKEDIN_PROFILE_URL_MESSAGE);
        return false;
      }
    }

    if (currentStep === 'suggestions' && !formData.eventSuggestions) {
      setError('Please provide your suggestions');
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate current step
      if (!validateCurrentStep()) {
        setIsLoading(false);
        return;
      }

      // Call custom handler if provided
      if (onContinue) {
        await onContinue();
      } else if (currentStep === 'summary') {
        // Trigger submission from ApplicationSummary component
        const { getSubmitHandler, isSubmissionSuccessful } = await import(
          './steps/application-summary'
        );
        const submitHandler = getSubmitHandler();
        if (submitHandler) {
          await submitHandler();
          // Check if submission was successful to hide buttons
          if (isSubmissionSuccessful()) {
            // Buttons will be hidden by the return null below
          }
        } else {
          setError('Submission handler not available');
        }
      } else {
        if (currentStep === 'welcome-2') {
          nextStep(); // welcome-2 -> modality
          nextStep(); // modality -> team-status
        } else {
          nextStep();
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFinalStep = currentStep === 'summary';
  const isFirstStep =
    currentStep === 'welcome-1' || currentStep === 'welcome-2';

  // Check if submission was successful - hide buttons if so
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (currentStep === 'summary') {
      import('./steps/application-summary').then(
        ({ isSubmissionSuccessful }) => {
          setIsSuccess(isSubmissionSuccessful());
        },
      );
    }
  }, [currentStep, isLoading]);

  // Don't render buttons after successful submission
  if (currentStep === 'summary' && isSuccess) {
    return null;
  }

  return (
    <div className="space-y-3 border-border border-t pt-8">
      {error && (
        <div className="rounded border border-destructive bg-destructive p-3 text-destructive-foreground text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        {canGoBack() && !isFirstStep && (
          <Button variant="outline" onClick={handleBack} disabled={isLoading}>
            ← Atrás
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
            '🚀 enviar'
          ) : (
            'Continuar →'
          )}
        </Button>
      </div>
    </div>
  );
}
