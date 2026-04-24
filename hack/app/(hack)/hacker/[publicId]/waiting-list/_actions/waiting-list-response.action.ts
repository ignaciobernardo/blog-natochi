'use server';

import { revalidatePath } from 'next/cache';
import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { getWaitingListEmailSender } from '@/src/operators/emails/submissions/by-event';
import { waitingListResponseNotifier } from '@/src/operators/slack/waiting-list-response-notifier';
import {
  getHackerByPublicId,
  getHackerStatusByPublicId,
} from '@/src/queries/hackers';
import {
  getSubmissionDetails,
  updateSubmissionStatus,
} from '@/src/queries/submissions';

async function validateWaitingListRequest(
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

  if (statusData.submission.status !== 'rejected') {
    return {
      valid: false,
      error: 'Submission is not in rejected status',
    };
  }

  return {
    valid: true,
    statusData,
  };
}

export async function joinWaitingListAction(
  submissionId: string,
  publicId: string,
) {
  try {
    const validation = await validateWaitingListRequest(submissionId, publicId);

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

    const _fromStatus = 'rejected';
    const toStatus = 'waiting_list';

    const result = await updateSubmissionStatus(submissionId, toStatus, null, {
      action: 'join_waiting_list',
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

    await waitingListResponseNotifier.notifyWaitingListJoin({
      submissionId,
    });

    await getWaitingListEmailSender(
      submissionDetails.event.slug,
    ).sendToAllMembers({
      submissionId,
      sentByUserId: null,
    });

    revalidatePath(`/hacker/${publicId}/waiting-list`);
    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      message: 'Successfully joined waiting list',
    };
  } catch (error) {
    console.error('Error joining waiting list:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to join waiting list',
    };
  }
}
