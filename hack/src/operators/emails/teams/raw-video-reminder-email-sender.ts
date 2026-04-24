import RawVideoReminderEmail from '@/src/emails/teams/raw-video-reminder';
import { sendEmail } from '@/src/lib/email';

interface SendRawVideoReminderParams {
  teamId: string;
  teamSlug: string;
  uploadFolderUrl: string;
  videoUrl?: string;
  members: Array<{
    email: string;
    fullName: string;
  }>;
}

export class RawVideoReminderEmailSender {
  async sendToAllMembers(params: SendRawVideoReminderParams): Promise<void> {
    try {
      const { teamSlug, uploadFolderUrl, videoUrl, members } = params;

      if (members.length === 0) {
        console.warn(
          `No members found for team ${teamSlug} to send raw video reminder`,
        );
        return;
      }

      const emailPromises = members.map(async (member) => {
        const subject = `Subir slides en PDF y Demo | Presentaciones Platanus Hack 25`;

        await sendEmail({
          templateName: 'raw-video-reminder',
          template: RawVideoReminderEmail,
          templateProps: {
            hackerName: member.fullName,
            teamSlug,
            uploadFolderUrl,
            videoUrl,
          },
          to: member.email,
          subject,
          sentByUserId: null,
        });
      });

      await Promise.all(emailPromises);

      console.log(
        `✅ Raw video reminder emails queued for ${members.length} team members of ${teamSlug}`,
      );
    } catch (error) {
      console.error(
        `Failed to send raw video reminder emails for team ${params.teamSlug}:`,
        error,
      );
    }
  }
}

export const rawVideoReminderEmailSender = new RawVideoReminderEmailSender();
