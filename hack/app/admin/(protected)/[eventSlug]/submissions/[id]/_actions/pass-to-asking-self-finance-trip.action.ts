'use server';

import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getAskingSelfFinanceTripEmailSender } from '@/src/operators/emails/submissions/by-event';
import { statusChangeNotifier } from '@/src/operators/slack/status-change-notifier';
import {
  getSubmissionById,
  getSubmissionDetails,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

export async function passToAskingSelfFinanceTripAction(submissionId: string) {
  try {
    const currentUser = await onlyAdminFull();

    const submission = await getSubmissionById(submissionId);

    if (!submission) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    if (
      submission.status !== 'received' &&
      submission.status !== 'priority_waiting'
    ) {
      return {
        success: false,
        error: `Cannot ask for self-finance from status "${submission.status}". Must be "received" or "priority_waiting".`,
      };
    }

    if (!currentUser.linkedId) {
      return {
        success: false,
        error: 'User linked ID is missing',
      };
    }

    const fromStatus = submission.status;
    const toStatus = 'asking_self_finance_trip';

    const result = await updateSubmissionStatus(
      submissionId,
      toStatus,
      currentUser.linkedId,
      { action: 'pass_to_asking_self_finance_trip' },
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    await statusChangeNotifier.notifyStatusChange({
      adminName: currentUser.name,
      submissionId,
      fromStatus,
      toStatus,
    });

    const submissionDetails = await getSubmissionDetails(submissionId);
    if (!submissionDetails) {
      return {
        success: false,
        error: 'Submission details not found',
      };
    }

    await getAskingSelfFinanceTripEmailSender(
      submissionDetails.event.slug,
    ).sendToAllMembers({
      submissionId,
      sentByUserId: currentUser.linkedId,
    });

    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      message: 'Self-finance request sent successfully',
    };
  } catch (error) {
    console.error('Error requesting self-finance:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to request self-finance',
    };
  }
}
