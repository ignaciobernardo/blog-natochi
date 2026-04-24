import { getAdminSubmissionPathById } from '@/src/lib/admin/events';
import { COUNTRIES } from '@/src/lib/constants';
import type { ReviewQualification } from '@/src/lib/db/schema';
import { resolveUrl } from '@/src/lib/utils/url';
import { getSubmissionDetails } from '@/src/queries/submissions';
import { slackService } from '@/src/services/slack';

interface ReviewNotificationData {
  adminName: string;
  submissionId: string;
  qualification: ReviewQualification;
}

const qualificationConfig: Record<
  ReviewQualification,
  { text: string; emoji: string }
> = {
  hell_yes: { text: 'hell yes', emoji: '🔥' },
  yes: { text: 'yes', emoji: '✅' },
  maybe: { text: 'maybe', emoji: '🤔' },
  no: { text: 'no', emoji: '❌' },
  hell_no: { text: 'hell no', emoji: '💀' },
};

export class ReviewNotifier {
  async notifyNewReview(data: ReviewNotificationData): Promise<void> {
    try {
      // Fetch submission details
      const submissionDetails = await getSubmissionDetails(data.submissionId);

      if (!submissionDetails) {
        console.error(
          'Failed to send Slack notification: Submission not found',
        );
        return;
      }

      // Determine submission type
      const submissionType =
        submissionDetails.submission.modality === 'solo'
          ? 'solo'
          : submissionDetails.submission.modality === 'team_looking'
            ? 'team_looking'
            : 'team';

      // Determine submission type text
      const typeText =
        submissionType === 'team'
          ? 'postulación de equipo'
          : submissionType === 'solo'
            ? 'postulación solo'
            : 'postulación buscando equipo';

      // Extract GitHub usernames from members
      const githubUsers = submissionDetails.members
        .map((member) => {
          if (!member.github) return null;
          // Extract username from GitHub URL or use as-is
          const username = member.github.includes('github.com')
            ? member.github.split('/').pop()
            : member.github;
          return username;
        })
        .filter((username): username is string => username !== null);

      // Format GitHub users
      const githubUsersText =
        githubUsers.length > 0 ? githubUsers.join(', ') : 'N/A';

      // Get country emoji
      const country = COUNTRIES.find(
        (c) => c.code === submissionDetails.submission.country,
      );
      const countryEmoji = country?.emoji || '';

      // Get qualification config
      const qualConfig = qualificationConfig[data.qualification];

      // Build submission URL
      const submissionUrl = resolveUrl(
        await getAdminSubmissionPathById(data.submissionId),
      );

      // Format message
      const message = `${data.adminName} calificó a la <${submissionUrl}|${typeText}> ${countryEmoji} de ${githubUsersText} como ${qualConfig.emoji} ${qualConfig.text}`;

      await slackService.sendMessage(message, { unfurlLinks: false });

      console.log('✅ Slack review notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack review notification:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }
}

// Export a singleton instance
export const reviewNotifier = new ReviewNotifier();
