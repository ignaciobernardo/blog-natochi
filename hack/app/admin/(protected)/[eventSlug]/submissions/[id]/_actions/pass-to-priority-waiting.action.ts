'use server';

import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getPriorityWaitingEmailSender } from '@/src/operators/emails/submissions/by-event';
import { statusChangeNotifier } from '@/src/operators/slack/status-change-notifier';
import {
  getSubmissionById,
  getSubmissionDetails,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

export async function passToPriorityWaitingAction(submissionId: string) {
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

    // Check if status is received
    if (submission.status !== 'received') {
      return {
        success: false,
        error: `Cannot move to priority waiting from status "${submission.status}". Must be "received".`,
      };
    }

    // Check if cohort is priority
    if (submission.cohort !== 'priority') {
      return {
        success: false,
        error:
          'Only priority cohort submissions can be moved to priority waiting',
      };
    }

    if (!currentUser.linkedId) {
      return {
        success: false,
        error: 'User linked ID is missing',
      };
    }

    const fromStatus = submission.status;
    const toStatus = 'priority_waiting';

    // Update submission status
    const result = await updateSubmissionStatus(
      submissionId,
      toStatus,
      currentUser.linkedId,
      { action: 'pass_to_priority_waiting' },
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Send Slack notification
    await statusChangeNotifier.notifyStatusChange({
      adminName: currentUser.name,
      submissionId,
      fromStatus,
      toStatus,
    });

    // Send email notification
    const submissionDetails = await getSubmissionDetails(submissionId);
    if (!submissionDetails) {
      return {
        success: false,
        error: 'Submission details not found',
      };
    }

    await getPriorityWaitingEmailSender(
      submissionDetails.event.slug,
    ).sendToAllMembers({
      submissionId,
      sentByUserId: currentUser.linkedId,
    });

    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      message: 'Submission moved to priority waiting successfully',
    };
  } catch (error) {
    console.error('Error moving submission to priority waiting:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to move submission to priority waiting',
    };
  }
}
