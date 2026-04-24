import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { statusHistory, submissions } from '@/src/lib/db/schema';

/**
 * Script to complete onboarding for yerk0v's submission
 * Usage: npx dotenv-cli -e .env.local -- npx tsx src/lib/dev/scripts/complete-onboarding-yerk0v.ts
 */

async function main() {
  const submissionId = '1eaec71c-62b7-4cf1-b412-16af71e6ab31';

  console.log('🔍 Finding submission for yerk0v...');

  // Verify submission exists
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
  });

  if (!submission) {
    console.error('❌ Submission not found');
    process.exit(1);
  }

  console.log(`✅ Found submission: ${submission.tallySubmissionId}`);
  console.log(`   Current status: ${submission.status}`);

  // Insert status history
  console.log('\n📝 Creating status history entry...');
  const [historyEntry] = await db
    .insert(statusHistory)
    .values({
      submissionId,
      fromStatus: submission.status,
      toStatus: 'onboarding_complete',
      context: {
        action: 'all_members_onboarding_complete',
        completedAt: new Date().toISOString(),
      },
      changedAt: new Date(),
    })
    .returning();

  console.log(`✅ Status history created: ${historyEntry.id}`);

  // Update submission status
  console.log('\n🔄 Updating submission status...');
  const [updatedSubmission] = await db
    .update(submissions)
    .set({ status: 'onboarding_complete' })
    .where(eq(submissions.id, submissionId))
    .returning();

  console.log(`✅ Submission updated to: ${updatedSubmission.status}`);
  console.log('\n✨ Done!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
