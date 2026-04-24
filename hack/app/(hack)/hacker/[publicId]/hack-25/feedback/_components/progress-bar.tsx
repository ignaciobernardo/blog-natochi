'use client';

import {
  FEEDBACK_STEPS,
  type FeedbackStep,
  useFeedbackStore,
} from '@/src/store/feedback.store';

interface ProgressBarProps {
  currentStep: FeedbackStep;
}

const STEP_LABELS: Record<FeedbackStep, string> = {
  overall: 'Experiencia General',
  quality: 'Calidad del Evento',
  improvement: 'Mejora Continua',
  sponsors: 'Sponsors',
  future: 'Futuro',
  extras: 'Extras',
  'thank-you': 'Gracias',
};

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const { maxStepReached } = useFeedbackStore();

  const maxIndex = FEEDBACK_STEPS.indexOf(maxStepReached);
  const progress = maxIndex >= 0 ? (maxIndex + 1) / FEEDBACK_STEPS.length : 0;

  return (
    <div className="space-y-3">
      <div className="h-1 w-full overflow-hidden rounded-full bg-card">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="font-semibold text-lg">
        {STEP_LABELS[currentStep] || currentStep}
      </div>
    </div>
  );
}
