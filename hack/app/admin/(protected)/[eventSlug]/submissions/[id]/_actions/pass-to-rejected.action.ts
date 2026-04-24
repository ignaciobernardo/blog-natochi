'use server';

import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getRejectedSubmissionEmailSender } from '@/src/operators/emails/submissions/by-event';
import { statusChangeNotifier } from '@/src/operators/slack/status-change-notifier';
import {
  getSubmissionById,
  getSubmissionDetails,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

export async function passToRejectedAction(submissionId: string) {
  try {
    const currentUser = await onlyAdminFull();

    // Get current submission
    const submission = await getSubmissionById(submissionId);

    if (!submission) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    // Check if status is received or priority_waiting
    if (
      submission.status !== 'received' &&
      submission.status !== 'priority_waiting'
    ) {
      return {
        success: false,
        error: `Cannot reject from status "${submission.status}". Must be "received" or "priority_waiting".`,
      };
    }

    if (!currentUser.linkedId) {
      return {
        success: false,
        error: 'User linked ID is missing',
      };
    }

    const fromStatus = submission.status;
    const toStatus = 'rejected';

    // Update submission status
    const result = await updateSubmissionStatus(
      submissionId,
      toStatus,
      currentUser.linkedId,
      { action: 'pass_to_rejected' },
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Send rejection email to all team members
    const submissionDetails = await getSubmissionDetails(submissionId);
    if (!submissionDetails) {
      return {
        success: false,
        error: 'Submission details not found',
      };
    }

    await getRejectedSubmissionEmailSender(
      submissionDetails.event.slug,
    ).sendToAllMembers({
      submissionId,
      sentByUserId: currentUser.linkedId,
    });

    // Send Slack notification
    await statusChangeNotifier.notifyStatusChange({
      adminName: currentUser.name,
      submissionId,
      fromStatus,
      toStatus,
    });

    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      message: 'Submission rejected successfully',
    };
  } catch (error) {
    console.error('Error rejecting submission:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to reject submission',
    };
  }
}
