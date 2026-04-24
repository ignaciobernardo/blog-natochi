'use client';

import { Suspense } from 'react';
import { ApplicationSummary } from './steps/application-summary';
import { MemberBuilder } from './steps/member-builder';
import { MemberConsiderations } from './steps/member-considerations';
import { MemberEducation } from './steps/member-education';
// Member collection steps (will be implemented)
import { MemberIntro } from './steps/member-intro';
import { MemberPersonal } from './steps/member-personal';
import { MemberRole } from './steps/member-role';
import { MemberVeteran } from './steps/member-veteran';
import { ModalitySelector } from './steps/modality-selector';
import { Suggestions } from './steps/suggestions';
// Final steps
import { TeamReady } from './steps/team-ready';
import { TeamSizeStep } from './steps/team-size';
// Team setup steps
import { TeamStatus } from './steps/team-status';
// Onboarding steps
import { Welcome1 } from './steps/welcome-1';
import { Welcome2 } from './steps/welcome-2';

interface StepRouterProps {
  step: string;
}

// Step loading skeleton
function StepLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 rounded bg-card"></div>
      <div className="h-64 rounded bg-card"></div>
    </div>
  );
}

export function StepRouter({ step }: StepRouterProps) {
  return (
    <Suspense fallback={<StepLoading />}>
      {/* Onboarding */}
      {step === 'welcome-1' && <Welcome1 />}
      {step === 'welcome-2' && <Welcome2 />}
      {step === 'modality' && <ModalitySelector />}

      {/* Team setup */}
      {step === 'team-status' && <TeamStatus />}
      {step === 'team-size' && <TeamSizeStep />}

      {/* Member collection - dynamic based on member number */}
      {step.match(/^member-intro-\d+$/) && (
        <MemberIntro memberIndex={parseInt(step.split('-')[2])} />
      )}
      {step.match(/^member-personal-\d+$/) && (
        <MemberPersonal memberIndex={parseInt(step.split('-')[2])} />
      )}
      {step.match(/^member-builder-\d+$/) && (
        <MemberBuilder memberIndex={parseInt(step.split('-')[2])} />
      )}
      {step.match(/^member-education-\d+$/) && (
        <MemberEducation memberIndex={parseInt(step.split('-')[2])} />
      )}
      {step.match(/^member-role-\d+$/) && (
        <MemberRole memberIndex={parseInt(step.split('-')[2])} />
      )}
      {step.match(/^member-veteran-\d+$/) && (
        <MemberVeteran memberIndex={parseInt(step.split('-')[2])} />
      )}
      {step.match(/^member-considerations-\d+$/) && (
        <MemberConsiderations memberIndex={parseInt(step.split('-')[2])} />
      )}

      {/* Final steps */}
      {step === 'team-ready' && <TeamReady />}
      {step === 'suggestions' && <Suggestions />}
      {step === 'summary' && <ApplicationSummary />}

      {/* Fallback for unknown steps */}
      {!step.match(
        /^(welcome-[12]|modality|team-status|team-size|member-.*|team-ready|suggestions|summary)$/,
      ) && (
        <div className="text-center text-destructive">Unknown step: {step}</div>
      )}
    </Suspense>
  );
}
