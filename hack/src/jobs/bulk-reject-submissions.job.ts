import { inArray, or } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { submissions } from '@/src/lib/db/schema';
import { getRejectedSubmissionEmailSender } from '@/src/operators/emails/submissions/by-event';
import { statusChangeNotifier } from '@/src/operators/slack/status-change-notifier';
import {
  getSubmissionDetails,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

const BATCH_LIMIT = 100;

export async function bulkRejectSubmissions() {
  console.log('[BULK-REJECT] Starting bulk rejection process...');

  try {
    const submissionsToReject = await db
      .select()
      .from(submissions)
      .where(or(inArray(submissions.status, ['received', 'priority_waiting'])))
      .limit(BATCH_LIMIT);

    console.log(
      `[BULK-REJECT] Found ${submissionsToReject.length} submissions to reject`,
    );

    if (submissionsToReject.length === 0) {
      console.log('[BULK-REJECT] No submissions to reject');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const submission of submissionsToReject) {
      try {
        const fromStatus = submission.status;
        const toStatus = 'rejected';

        const result = await updateSubmissionStatus(
          submission.id,
          toStatus,
          null,
          { action: 'bulk_reject' },
        );

        if (!result.success) {
          console.error(
            `[BULK-REJECT] Failed to update submission ${submission.id}: ${result.error}`,
          );
          errorCount++;
          continue;
        }

        const submissionDetails = await getSubmissionDetails(submission.id);
        if (!submissionDetails) {
          errorCount++;
          continue;
        }

        await getRejectedSubmissionEmailSender(
          submissionDetails.event.slug,
        ).sendToAllMembers({
          submissionId: submission.id,
          sentByUserId: null,
        });

        await statusChangeNotifier.notifyStatusChange({
          adminName: 'System (Bulk Reject)',
          submissionId: submission.id,
          fromStatus,
          toStatus,
        });

        successCount++;
        console.log(
          `[BULK-REJECT] Successfully rejected submission ${submission.id}`,
        );
      } catch (error) {
        errorCount++;
        console.error(
          `[BULK-REJECT] Error processing submission ${submission.id}:`,
          error,
        );
      }
    }

    console.log(
      `[BULK-REJECT] Completed. Success: ${successCount}, Errors: ${errorCount}`,
    );
  } catch (error) {
    console.error('[BULK-REJECT] Fatal error:', error);
    throw error;
  }
}
