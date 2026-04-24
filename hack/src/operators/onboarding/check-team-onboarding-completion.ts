import {
  getSubmissionDetails,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

interface CheckTeamOnboardingCompletionParams {
  submissionId: string;
}

export class CheckTeamOnboardingCompletion {
  async check(params: CheckTeamOnboardingCompletionParams): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(params.submissionId);

      if (!submissionDetails) {
        console.error(
          `Failed to check team onboarding completion: Submission ${params.submissionId} not found`,
        );
        return;
      }

      if (submissionDetails.submission.status !== 'onboarding_request') {
        console.log(
          `Skipping onboarding completion check: Submission ${params.submissionId} is not in onboarding_request status (current: ${submissionDetails.submission.status})`,
        );
        return;
      }

      const allMembersCompleted = submissionDetails.members.every(
        (member) => member.profile?.onboardCompleteAt !== null,
      );

      if (allMembersCompleted && submissionDetails.members.length > 0) {
        console.log(
          `✅ All members of submission ${params.submissionId} have completed onboarding. Moving to onboarding_complete.`,
        );

        await updateSubmissionStatus(
          params.submissionId,
          'onboarding_complete',
          null,
          {
            action: 'all_members_onboarding_complete',
            completedAt: new Date().toISOString(),
          },
        );

        console.log(
          `✅ Submission ${params.submissionId} moved to onboarding_complete`,
        );
      } else {
        const completedCount = submissionDetails.members.filter(
          (m) => m.profile?.onboardCompleteAt !== null,
        ).length;
        console.log(
          `Onboarding progress for submission ${params.submissionId}: ${completedCount}/${submissionDetails.members.length} members completed`,
        );
      }
    } catch (error) {
      console.error('Failed to check team onboarding completion:', error);
    }
  }
}

export const checkTeamOnboardingCompletion =
  new CheckTeamOnboardingCompletion();
