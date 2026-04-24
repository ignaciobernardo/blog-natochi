import { votingStartedSender } from '@/src/operators/emails/projects/voting-started-sender';

export async function sendVotingStarted(): Promise<undefined> {
  console.log('🚀 Starting voting started email sender...');

  try {
    await votingStartedSender.sendToAllTeamMembers();
    console.log('✅ Voting started emails sent successfully!');
  } catch (error) {
    console.error('❌ Error sending voting started emails:', error);
    throw error;
  }

  return undefined;
}
