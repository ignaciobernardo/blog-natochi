'use server';

import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getWithdrawnSubmissionEmailSender } from '@/src/operators/emails/submissions/by-event';
import { statusChangeNotifier } from '@/src/operators/slack/status-change-notifier';
import {
  getSubmissionById,
  getSubmissionDetails,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

export async function passToWithdrawnAction(submissionId: string) {
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

    // Check if status allows withdrawal
    const allowedStatuses = [
      'approved',
      'onboarding_request',
      'onboarding_expired',
      'onboarding_complete',
    ];
    if (!allowedStatuses.includes(submission.status)) {
      return {
        success: false,
        error: `Cannot withdraw from status "${submission.status}". Must be one of: ${allowedStatuses.join(', ')}.`,
      };
    }

    if (!currentUser.linkedId) {
      return {
        success: false,
        error: 'User linked ID is missing',
      };
    }

    const fromStatus = submission.status;
    const toStatus = 'withdrawn';

    // Update submission status
    const result = await updateSubmissionStatus(
      submissionId,
      toStatus,
      currentUser.linkedId,
      { action: 'pass_to_withdrawn' },
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Send withdrawal email to all team members
    const submissionDetails = await getSubmissionDetails(submissionId);
    if (!submissionDetails) {
      return {
        success: false,
        error: 'Submission details not found',
      };
    }

    await getWithdrawnSubmissionEmailSender(
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
      message: 'Submission withdrawn successfully',
    };
  } catch (error) {
    console.error('Error withdrawing submission:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to withdraw submission',
    };
  }
}
