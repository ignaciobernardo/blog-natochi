import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers } from '@/src/lib/db/schema';
import { getOnboardingCompleteEmailSender } from '@/src/operators/emails/submissions/by-event';
import { onboardingCompletionNotifier } from '@/src/operators/slack/onboarding-completion-notifier';
import { getSubmissionDetails } from '@/src/queries/submissions';
import { checkTeamOnboardingCompletion } from './check-team-onboarding-completion';

interface FinishOnboardingParams {
  hackerProfileId: string;
  hackerId: string;
}

export class FinishOnboarding {
  async finish(params: FinishOnboardingParams): Promise<void> {
    try {
      const hackerProfile = await db.query.hackerProfiles.findFirst({
        where: eq(hackerProfiles.id, params.hackerProfileId),
      });

      if (!hackerProfile) {
        console.error(
          `Failed to finish onboarding: Hacker profile ${params.hackerProfileId} not found`,
        );
        return;
      }

      if (hackerProfile.onboardCompleteAt) {
        console.log(
          `Hacker profile ${params.hackerProfileId} already completed onboarding`,
        );
        return;
      }

      await db
        .update(hackerProfiles)
        .set({
          onboardCompleteAt: new Date(),
        })
        .where(eq(hackerProfiles.id, params.hackerProfileId));

      console.log(
        `✅ Marked onboarding complete for hacker profile ${params.hackerProfileId}`,
      );

      await onboardingCompletionNotifier.notifyOnboardingCompletion({
        submissionId: hackerProfile.submissionId,
        hackerId: params.hackerId,
      });

      const hacker = await db.query.hackers.findFirst({
        where: eq(hackers.id, params.hackerId),
      });

      if (hacker) {
        const submissionDetails = await getSubmissionDetails(
          hackerProfile.submissionId,
        );

        if (!submissionDetails) {
          console.error(
            `Failed to send onboarding complete email: Submission ${hackerProfile.submissionId} not found`,
          );
          return;
        }

        await getOnboardingCompleteEmailSender(
          submissionDetails.event.slug,
        ).sendToHacker({
          hackerId: params.hackerId,
          hackerEmail: hacker.email,
        });
      } else {
        console.error(
          `Failed to send onboarding complete email: Hacker ${params.hackerId} not found`,
        );
      }

      await checkTeamOnboardingCompletion.check({
        submissionId: hackerProfile.submissionId,
      });
    } catch (error) {
      console.error('Failed to finish onboarding:', error);
      throw error;
    }
  }
}

export const finishOnboarding = new FinishOnboarding();
