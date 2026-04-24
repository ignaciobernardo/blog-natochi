'use server';

import { getAdminSubmissionPathById } from '@/src/lib/admin/events';
import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdmin } from '@/src/lib/auth/server';
import { resolveUrl } from '@/src/lib/utils/url';
import { flightRequestNotifier } from '@/src/operators/slack/flight-request-notifier';
import {
  createFlightRequest,
  getSubmissionDetails,
} from '@/src/queries/submissions';

export async function addFlightRequestAction(
  submissionId: string,
  content: string,
) {
  try {
    const user = await onlyAdmin();

    if (!user.linkedId) {
      return {
        success: false,
        error: 'Admin user not properly configured',
      };
    }

    if (!content.trim()) {
      return {
        success: false,
        error: 'Flight request content is required',
      };
    }

    const flightRequest = await createFlightRequest({
      submissionId,
      authorAdminId: user.linkedId,
      content: content.trim(),
    });

    // Fetch submission details for Slack notification
    const submissionDetails = await getSubmissionDetails(submissionId);

    if (submissionDetails) {
      // Determine submission type based on modality
      const submissionType =
        submissionDetails.submission.modality === 'solo'
          ? 'solo'
          : submissionDetails.submission.modality === 'team_looking'
            ? 'team_looking'
            : 'team';

      // Extract GitHub usernames from members
      const githubUsers = submissionDetails.members
        .map((member) => {
          if (!member.github) return null;
          // Extract username from GitHub URL or use as-is
          const username = member.github.includes('github.com')
            ? member.github.split('/').pop()
            : member.github;
          return username;
        })
        .filter((username): username is string => username !== null);

      // Send Slack notification
      const submissionUrl = resolveUrl(
        await getAdminSubmissionPathById(submissionId),
      );
      await flightRequestNotifier.notifyNewFlightRequest({
        adminName: user.name,
        submissionId,
        flightRequestContent: content.trim(),
        submissionUrl,
        submissionType,
        githubUsers,
        countryCode: submissionDetails.submission.country,
      });
    }

    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      flightRequest,
    };
  } catch (error) {
    console.error('Add flight request error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to add flight request',
    };
  }
}
