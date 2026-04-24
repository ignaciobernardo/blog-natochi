'use server';

import { getAdminSubmissionPathById } from '@/src/lib/admin/events';
import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdmin } from '@/src/lib/auth/server';
import { resolveUrl } from '@/src/lib/utils/url';
import { noteNotifier } from '@/src/operators/slack/note-notifier';
import {
  createSubmissionNote,
  getSubmissionDetails,
} from '@/src/queries/submissions';

export async function addNoteAction(submissionId: string, body: string) {
  try {
    const user = await onlyAdmin();

    if (!user.linkedId) {
      return {
        success: false,
        error: 'Admin user not properly configured',
      };
    }

    if (!body.trim()) {
      return {
        success: false,
        error: 'Note body is required',
      };
    }

    const note = await createSubmissionNote({
      submissionId,
      authorAdminId: user.linkedId,
      body: body.trim(),
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
      await noteNotifier.notifyNewNote({
        adminName: user.name,
        submissionId,
        noteBody: body.trim(),
        submissionUrl,
        submissionType,
        githubUsers,
        countryCode: submissionDetails.submission.country,
      });
    }

    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      note,
    };
  } catch (error) {
    console.error('Add note error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add note',
    };
  }
}
