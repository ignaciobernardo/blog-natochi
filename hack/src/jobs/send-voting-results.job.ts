import { votingResultsSender } from '@/src/operators/emails/projects/voting-results-sender';

export async function sendVotingResults(): Promise<undefined> {
  console.log('🚀 Starting voting results email sender...');

  try {
    await votingResultsSender.sendToAllTeamMembers();
    console.log('✅ Voting results emails sent successfully!');
  } catch (error) {
    console.error('❌ Error sending voting results emails:', error);
    throw error;
  }

  return undefined;
}
