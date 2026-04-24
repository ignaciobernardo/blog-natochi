'use client';

import {
  useApplicationStore,
  useStepSequence,
} from '@/src/store/application.store';

interface ProgressBarProps {
  currentStep: string;
}

const STEP_LABELS: Record<string, string> = {
  'welcome-1': 'Welcome',
  'welcome-2': 'Welcome',
  modality: 'Choose Path',
  'team-status': 'Team Status',
  'team-size': 'Team Size',
  'member-intro-1': 'Team_Leader',
  'member-intro-2': 'Hacker2',
  'member-intro-3': 'Hacker3',
  'team-ready': 'Team Ready',
  suggestions: 'Suggestions',
  'final-submission': 'Submit',
};

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const { maxStepReached } = useApplicationStore();
  const steps = useStepSequence();

  const maxIndex = steps.indexOf(maxStepReached);
  const progress = maxIndex >= 0 ? (maxIndex + 1) / steps.length : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-card">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Current step label */}
      <div className="font-semibold text-lg">
        {STEP_LABELS[currentStep] || currentStep}
      </div>
    </div>
  );
}
