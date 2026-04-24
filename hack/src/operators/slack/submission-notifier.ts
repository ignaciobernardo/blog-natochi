import { getAdminSubmissionPathById } from '@/src/lib/admin/events';
import type { Event } from '@/src/lib/db/schema';
import type { HackerRole } from '@/src/lib/types/application';
import { getCountryEmoji } from '@/src/lib/utils/countries';
import { resolveUrl } from '@/src/lib/utils/url';
import { getSubmissionStats } from '@/src/queries/stats';
import { slackService } from '@/src/services/slack';

interface HackerInfo {
  fullName: string;
  email: string;
  country: string | null;
  age: number | null;
  github: string | null;
  linkedin: string | null;
  bio: string | null;
  education: string | null;
  roles: HackerRole[];
  isVeteran: boolean;
  previousHackathons: string | null;
  shirtSize: string | null;
  diet: string | null;
}

interface SubmissionData {
  submissionId: string;
  isSolo: boolean;
  isTeamLooking: boolean;
  hackersCount: number;
  hackerNames: string[];
  hackers: HackerInfo[];
  eventSuggestions?: string;
}

export class SubmissionNotifier {
  private getBaseUrl(): string {
    return resolveUrl();
  }

  async notifyNewSubmission(
    submission: SubmissionData,
    event: Event,
  ): Promise<void> {
    try {
      // Get current stats
      const stats = await getSubmissionStats(event.id);

      // Determine submission type text
      const typeText = submission.isSolo
        ? 'de solo'
        : submission.isTeamLooking
          ? 'buscando equipo'
          : 'de equipo';

      // Build submission URL
      const baseUrl = this.getBaseUrl();
      const adminPath = await getAdminSubmissionPathById(
        submission.submissionId,
      );
      const submissionUrl = `${baseUrl}${adminPath}`;

      // Get GitHub usernames
      const githubUsernames = submission.hackers
        .map((h) => h.github?.split('/').pop())
        .filter(Boolean)
        .join(', ');

      // Get main country emoji (from first member)
      const mainCountryEmoji = submission.hackers[0]?.country
        ? getCountryEmoji(submission.hackers[0].country)
        : '';

      // Format role emoji map
      const roleEmojis: Record<HackerRole, string> = {
        desarrollo: '💻',
        producto: '📱',
        diseno: '🎨',
        ventas: '💼',
        qa: '🔍',
      };

      // Build participant detail blocks (one section per hacker to stay under Slack's 3000 char limit)
      const participantBlocks = submission.hackers.map((hacker) => {
        const countryEmoji = hacker.country
          ? getCountryEmoji(hacker.country)
          : '';
        const githubUsername = hacker.github?.split('/').pop();
        const linkedinUsername = hacker.linkedin?.split('/').pop();

        const lines = [
          `*${hacker.fullName}* ${countryEmoji}`,
          `• Email: ${hacker.email}`,
          `• GitHub: ${hacker.github ? `<${hacker.github}|${githubUsername}>` : 'N/A'}`,
          `• LinkedIn: ${hacker.linkedin ? `<${hacker.linkedin}|${linkedinUsername}>` : 'N/A'}`,
          `• Edad: ${hacker.age || 'N/A'}`,
          `• Roles: ${hacker.roles.map((r) => `${roleEmojis[r]} ${r}`).join(', ')}`,
        ];

        if (hacker.bio) {
          lines.push(
            `• Bio: ${hacker.bio.length > 300 ? `${hacker.bio.slice(0, 300)}…` : hacker.bio}`,
          );
        }

        if (hacker.education) {
          lines.push(
            `• Educación: ${hacker.education.length > 300 ? `${hacker.education.slice(0, 300)}…` : hacker.education}`,
          );
        }

        if (hacker.isVeteran && hacker.previousHackathons) {
          lines.push(
            `• Hackathons previos: ${hacker.previousHackathons.length > 300 ? `${hacker.previousHackathons.slice(0, 300)}…` : hacker.previousHackathons}`,
          );
        }

        lines.push(
          `• Polera: ${hacker.shirtSize || 'N/A'}, Dieta: ${hacker.diet || 'N/A'}`,
        );

        return {
          type: 'section' as const,
          text: {
            type: 'mrkdwn' as const,
            text: lines.join('\n'),
          },
        };
      });

      // Build the message
      const headerText = `Nueva postulación ${typeText} ${mainCountryEmoji} de ${githubUsernames || 'participantes'} - ${event.name}`;

      await slackService.sendRichMessage({
        text: headerText,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*<${submissionUrl}|Nueva postulación ${typeText}>* ${mainCountryEmoji} de ${githubUsernames || 'participantes'} - ${event.name}`,
            },
          },
          {
            type: 'divider',
          },
          ...participantBlocks,
          ...(submission.eventSuggestions
            ? [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Sugerencias para el evento:*\n> ${submission.eventSuggestions}`,
                  },
                },
              ]
            : []),
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*📊 Stats Generales*',
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Total Participantes:*\n${stats.totalHackers}`,
              },
              {
                type: 'mrkdwn',
                text: `*Total Equipos:*\n${stats.totalTeams} (${stats.totalHackersInTeams} hackers)`,
              },
              {
                type: 'mrkdwn',
                text: `*Solo:*\n${stats.totalSoloParticipants}`,
              },
              {
                type: 'mrkdwn',
                text: `*Buscando Equipo:*\n${stats.totalTeamLookingParticipants}`,
              },
            ],
          },
        ],
      });

      console.log(
        '✅ Slack notification sent successfully for submission:',
        submission.submissionId,
      );
    } catch (error) {
      console.error('Failed to send Slack notification:', {
        submissionId: submission.submissionId,
        hackersCount: submission.hackersCount,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error; // Re-throw to be caught by caller
    }
  }
}

// Export a singleton instance
export const submissionNotifier = new SubmissionNotifier();
