import { resolveUrl } from '@/src/lib/utils/url';
import { getProjectById } from '@/src/queries/projects';
import { getProjectVoteCount } from '@/src/queries/votes';
import { slackService } from '@/src/services/slack';

interface VoteNotificationData {
  userEmail: string;
  projectId: string;
  projectSlug?: string;
  voteAction: 'added' | 'removed';
}

export class VoteNotifier {
  async notifyVote(data: VoteNotificationData): Promise<void> {
    try {
      // Fetch project details
      const project = await getProjectById(data.projectId);

      if (!project) {
        console.error('Failed to send Slack notification: Project not found');
        return;
      }

      // Get updated vote count
      const voteCount = await getProjectVoteCount(data.projectId);

      // Build project URL
      const projectUrl = resolveUrl(
        `/25/vote/${data.projectSlug || project.slug}`,
      );

      // Determine action emoji and verb
      const actionEmoji = data.voteAction === 'added' ? '👍' : '👎';
      const actionVerb =
        data.voteAction === 'added' ? 'votó por' : 'quitó su voto de';

      // Format message
      const message = `${actionEmoji} ${data.userEmail} ${actionVerb} <${projectUrl}|${project.name}> (${voteCount} ${voteCount === 1 ? 'voto' : 'votos'})`;

      await slackService.sendMessage(message, { unfurlLinks: false });

      console.log('✅ Slack vote notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack vote notification:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }
}

// Export a singleton instance
export const voteNotifier = new VoteNotifier();
