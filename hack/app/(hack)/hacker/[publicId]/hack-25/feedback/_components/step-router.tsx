'use client';

import { Suspense } from 'react';
import type { FeedbackStep } from '@/src/store/feedback.store';
import { EventQuality } from './steps/event-quality';
import { Extras } from './steps/extras';
import { Future } from './steps/future';
import { Improvement } from './steps/improvement';
import { OverallExperience } from './steps/overall-experience';
import { Sponsors } from './steps/sponsors';
import { ThankYou } from './steps/thank-you';

interface MentorInfo {
  id: string;
  name: string | null;
}

interface StepRouterProps {
  step: FeedbackStep;
  mentor: MentorInfo | null;
}

function StepLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 rounded bg-card" />
      <div className="h-64 rounded bg-card" />
    </div>
  );
}

export function StepRouter({ step, mentor }: StepRouterProps) {
  return (
    <Suspense fallback={<StepLoading />}>
      {step === 'overall' && <OverallExperience mentor={mentor} />}
      {step === 'quality' && <EventQuality />}
      {step === 'improvement' && <Improvement />}
      {step === 'sponsors' && <Sponsors />}
      {step === 'future' && <Future />}
      {step === 'extras' && <Extras />}
      {step === 'thank-you' && <ThankYou />}
    </Suspense>
  );
}
