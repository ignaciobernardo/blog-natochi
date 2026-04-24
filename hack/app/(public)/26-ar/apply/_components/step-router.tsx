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
import { Suggestions } from './steps/suggestions';
// Final steps
import { TeamReady } from './steps/team-ready';
import { TeamSizeStep } from './steps/team-size';
// Team setup steps
import { TeamStatus } from './steps/team-status';
import { Welcome2 } from './steps/welcome-2';

interface StepRouterProps {
  step: string;
  eventName: string;
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

export function StepRouter({ step, eventName }: StepRouterProps) {
  const effectiveStep =
    step === 'welcome-1'
      ? 'welcome-2'
      : step === 'modality'
        ? 'team-status'
        : step;

  return (
    <Suspense fallback={<StepLoading />}>
      {/* Onboarding */}
      {effectiveStep === 'welcome-2' && <Welcome2 eventName={eventName} />}

      {/* Team setup */}
      {effectiveStep === 'team-status' && <TeamStatus />}
      {effectiveStep === 'team-size' && <TeamSizeStep />}

      {/* Member collection - dynamic based on member number */}
      {effectiveStep.match(/^member-intro-\d+$/) && (
        <MemberIntro memberIndex={parseInt(effectiveStep.split('-')[2])} />
      )}
      {effectiveStep.match(/^member-personal-\d+$/) && (
        <MemberPersonal memberIndex={parseInt(effectiveStep.split('-')[2])} />
      )}
      {effectiveStep.match(/^member-builder-\d+$/) && (
        <MemberBuilder memberIndex={parseInt(effectiveStep.split('-')[2])} />
      )}
      {effectiveStep.match(/^member-education-\d+$/) && (
        <MemberEducation memberIndex={parseInt(effectiveStep.split('-')[2])} />
      )}
      {effectiveStep.match(/^member-role-\d+$/) && (
        <MemberRole memberIndex={parseInt(effectiveStep.split('-')[2])} />
      )}
      {effectiveStep.match(/^member-veteran-\d+$/) && (
        <MemberVeteran memberIndex={parseInt(effectiveStep.split('-')[2])} />
      )}
      {effectiveStep.match(/^member-considerations-\d+$/) && (
        <MemberConsiderations
          memberIndex={parseInt(effectiveStep.split('-')[2])}
        />
      )}

      {/* Final steps */}
      {effectiveStep === 'team-ready' && <TeamReady />}
      {effectiveStep === 'suggestions' && <Suggestions />}
      {effectiveStep === 'summary' && <ApplicationSummary />}

      {/* Fallback for unknown steps */}
      {!effectiveStep.match(
        /^(welcome-[12]|team-status|team-size|member-.*|team-ready|suggestions|summary)$/,
      ) && (
        <div className="text-center text-destructive">
          Unknown step: {effectiveStep}
        </div>
      )}
    </Suspense>
  );
}
