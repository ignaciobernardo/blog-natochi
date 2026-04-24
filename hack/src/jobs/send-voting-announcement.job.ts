import { votingAnnouncementSender } from '@/src/operators/emails/projects/voting-announcement-sender';

export async function sendVotingAnnouncement(): Promise<undefined> {
  console.log('🚀 Starting voting announcement email sender...');

  try {
    await votingAnnouncementSender.sendToAllTeamMembers();
    console.log('✅ Voting announcement emails sent successfully!');
  } catch (error) {
    console.error('❌ Error sending voting announcement emails:', error);
    throw error;
  }

  return undefined;
}
