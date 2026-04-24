'use server';

import { revalidatePath } from 'next/cache';
import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import {
  getApprovedSubmissionEmailSender,
  getSelfFinanceRejectionEmailSender,
} from '@/src/operators/emails/submissions/by-event';
import { selfFinanceResponseNotifier } from '@/src/operators/slack/self-finance-response-notifier';
import {
  getHackerByPublicId,
  getHackerStatusByPublicId,
} from '@/src/queries/hackers';
import {
  getLatestStatusChange,
  getSubmissionDetails,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

async function validateSelfFinanceRequest(
  submissionId: string,
  publicId: string,
) {
  const statusData = await getHackerStatusByPublicId(publicId);

  if (!statusData) {
    return {
      valid: false,
      error: 'Hacker not found',
    };
  }

  if (statusData.submission.id !== submissionId) {
    return {
      valid: false,
      error: 'Submission mismatch',
    };
  }

  if (statusData.submission.status !== 'asking_self_finance_trip') {
    return {
      valid: false,
      error: 'Submission is not in asking_self_finance_trip status',
    };
  }

  const latestStatusChange = await getLatestStatusChange(submissionId);
  if (!latestStatusChange) {
    return {
      valid: false,
      error: 'No status change found',
    };
  }

  const deadline = new Date(latestStatusChange.changedAt);
  deadline.setHours(deadline.getHours() + 48);

  if (new Date() > deadline) {
    return {
      valid: false,
      error: 'Deadline has expired',
    };
  }

  return {
    valid: true,
    statusData,
  };
}

export async function acceptSelfFinanceTripAction(
  submissionId: string,
  publicId: string,
) {
  try {
    const validation = await validateSelfFinanceRequest(submissionId, publicId);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const hacker = await getHackerByPublicId(publicId);
    if (!hacker) {
      return {
        success: false,
        error: 'Hacker not found',
      };
    }

    const _fromStatus = 'asking_self_finance_trip';
    const toStatus = 'approved';

    const result = await updateSubmissionStatus(submissionId, toStatus, null, {
      action: 'accept_self_finance_trip',
      publicId,
      hackerId: hacker.id,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    const submissionDetails = await getSubmissionDetails(submissionId);
    if (!submissionDetails) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    await selfFinanceResponseNotifier.notifySelfFinanceResponse({
      submissionId,
      accepted: true,
    });

    await getApprovedSubmissionEmailSender(
      submissionDetails.event.slug,
    ).sendToAllMembers({
      submissionId,
      sentByUserId: null,
    });

    revalidatePath(`/hacker/${publicId}/self-finance-flight`);
    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      message: 'Self-finance trip accepted successfully',
    };
  } catch (error) {
    console.error('Error accepting self-finance trip:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to accept self-finance trip',
    };
  }
}

export async function rejectSelfFinanceTripAction(
  submissionId: string,
  publicId: string,
) {
  try {
    const validation = await validateSelfFinanceRequest(submissionId, publicId);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const hacker = await getHackerByPublicId(publicId);
    if (!hacker) {
      return {
        success: false,
        error: 'Hacker not found',
      };
    }

    const _fromStatus = 'asking_self_finance_trip';
    const toStatus = 'rejected';

    const result = await updateSubmissionStatus(submissionId, toStatus, null, {
      action: 'reject_self_finance_trip',
      publicId,
      hackerId: hacker.id,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    const submissionDetails = await getSubmissionDetails(submissionId);
    if (!submissionDetails) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    await selfFinanceResponseNotifier.notifySelfFinanceResponse({
      submissionId,
      accepted: false,
    });

    await getSelfFinanceRejectionEmailSender(
      submissionDetails.event.slug,
    ).sendToAllMembers({
      submissionId,
      sentByUserId: null,
    });

    revalidatePath(`/hacker/${publicId}/self-finance-flight`);
    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      message: 'Self-finance trip rejected successfully',
    };
  } catch (error) {
    console.error('Error rejecting self-finance trip:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to reject self-finance trip',
    };
  }
}
