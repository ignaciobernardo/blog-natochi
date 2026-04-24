import { getAdminSubmissionPathById } from '@/src/lib/admin/events';
import { COUNTRIES } from '@/src/lib/constants';
import { resolveUrl } from '@/src/lib/utils/url';
import {
  getOnboardingCompletionStats,
  getSubmissionDetails,
} from '@/src/queries/submissions';
import { slackService } from '@/src/services/slack';

interface OnboardingCompletionNotificationData {
  submissionId: string;
  hackerId: string;
}

export class OnboardingCompletionNotifier {
  async notifyOnboardingCompletion(
    data: OnboardingCompletionNotificationData,
  ): Promise<void> {
    try {
      const submissionDetails = await getSubmissionDetails(data.submissionId);

      if (!submissionDetails) {
        console.error(
          'Failed to send Slack notification: Submission not found',
        );
        return;
      }

      const hacker = submissionDetails.members.find(
        (member) => member.id === data.hackerId,
      );

      if (!hacker) {
        console.error(
          'Failed to send Slack notification: Hacker not found in submission',
        );
        return;
      }

      const githubUsername = hacker.github
        ? hacker.github.includes('github.com')
          ? hacker.github.split('/').pop()
          : hacker.github
        : 'N/A';

      const hackerCountry = hacker.profile?.country;
      const country = COUNTRIES.find((c) => c.code === hackerCountry);
      const countryEmoji = country?.emoji || '';

      const submissionUrl = resolveUrl(
        await getAdminSubmissionPathById(data.submissionId),
      );

      const githubLink =
        githubUsername !== 'N/A'
          ? `<${submissionUrl}|${githubUsername}>`
          : githubUsername;

      const stats = await getOnboardingCompletionStats(
        submissionDetails.submission.eventId,
      );

      const message = `🎉 ${countryEmoji} ${githubLink} completó el onboarding (${stats.completed}/${stats.total}, ${stats.percentage}%)`;

      await slackService.sendMessage(message, { unfurlLinks: false });

      console.log(
        '✅ Slack onboarding completion notification sent successfully',
      );
    } catch (error) {
      console.error(
        'Failed to send Slack onboarding completion notification:',
        error,
      );
      // Don't throw error to prevent breaking the main flow
    }
  }
}

export const onboardingCompletionNotifier = new OnboardingCompletionNotifier();
