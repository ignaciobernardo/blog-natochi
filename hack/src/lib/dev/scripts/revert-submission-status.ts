import { and, eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { statusHistory, submissions } from '@/src/lib/db/schema';

const SUBMISSION_ID = '88d1e336-cd0b-438e-b715-6ae29028adc0';

async function revertSubmissionStatus() {
  console.log(`Looking for submission: ${SUBMISSION_ID}`);

  // Find the submission
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, SUBMISSION_ID),
  });

  if (!submission) {
    console.error('❌ Submission not found');
    return;
  }

  console.log(`✓ Found submission with current status: ${submission.status}`);

  // Delete status history entries related to rejection
  const deletedHistory = await db
    .delete(statusHistory)
    .where(
      and(
        eq(statusHistory.submissionId, SUBMISSION_ID),
        eq(statusHistory.toStatus, 'rejected'),
      ),
    )
    .returning();

  console.log(`✓ Deleted ${deletedHistory.length} status history record(s)`);

  // Update submission status back to 'received'
  const [updatedSubmission] = await db
    .update(submissions)
    .set({ status: 'received' })
    .where(eq(submissions.id, SUBMISSION_ID))
    .returning();

  console.log(`✓ Updated submission status to: ${updatedSubmission.status}`);
  console.log('✅ Status revert completed successfully');
}

revertSubmissionStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error reverting submission status:', error);
    process.exit(1);
  });
