'use server';

import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getApprovedSubmissionEmailSender } from '@/src/operators/emails/submissions/by-event';
import { statusChangeNotifier } from '@/src/operators/slack/status-change-notifier';
import {
  getSubmissionById,
  getSubmissionDetails,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

export async function passToApprovedAction(submissionId: string) {
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

    // Check if status is received, priority_waiting, or waiting_list
    if (
      submission.status !== 'received' &&
      submission.status !== 'priority_waiting' &&
      submission.status !== 'waiting_list'
    ) {
      return {
        success: false,
        error: `Cannot approve from status "${submission.status}". Must be "received", "priority_waiting", or "waiting_list".`,
      };
    }

    if (!currentUser.linkedId) {
      return {
        success: false,
        error: 'User linked ID is missing',
      };
    }

    const fromStatus = submission.status;
    const toStatus = 'approved';

    // Update submission status
    const result = await updateSubmissionStatus(
      submissionId,
      toStatus,
      currentUser.linkedId,
      { action: 'pass_to_approved' },
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

    // Queue approval emails for all team members
    const submissionDetails = await getSubmissionDetails(submissionId);
    if (!submissionDetails) {
      return {
        success: false,
        error: 'Submission details not found',
      };
    }

    await getApprovedSubmissionEmailSender(
      submissionDetails.event.slug,
    ).sendToAllMembers({
      submissionId,
      sentByUserId: currentUser.linkedId,
    });

    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      message: 'Submission approved successfully',
    };
  } catch (error) {
    console.error('Error approving submission:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to approve submission',
    };
  }
}
