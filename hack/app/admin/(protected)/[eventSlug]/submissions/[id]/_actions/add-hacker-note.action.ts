'use server';

import { getAdminSubmissionPathById } from '@/src/lib/admin/events';
import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdmin } from '@/src/lib/auth/server';
import { resolveUrl } from '@/src/lib/utils/url';
import { hackerNoteNotifier } from '@/src/operators/slack/hacker-note-notifier';
import { createHackerNote } from '@/src/queries/hackers';
import { getSubmissionDetails } from '@/src/queries/submissions';

export async function addHackerNoteAction(
  submissionId: string,
  hackerId: string,
  body: string,
) {
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

    const note = await createHackerNote({
      hackerId,
      authorAdminId: user.linkedId,
      body: body.trim(),
    });

    // Fetch submission details for Slack notification
    const submissionDetails = await getSubmissionDetails(submissionId);

    if (submissionDetails) {
      // Find the hacker in the members list
      const hacker = submissionDetails.members.find((m) => m.id === hackerId);

      if (hacker) {
        // Determine submission type based on modality
        const submissionType =
          submissionDetails.submission.modality === 'solo'
            ? 'solo'
            : submissionDetails.submission.modality === 'team_looking'
              ? 'team_looking'
              : 'team';

        // Send Slack notification
        const submissionUrl = resolveUrl(
          await getAdminSubmissionPathById(submissionId),
        );
        await hackerNoteNotifier.notifyNewNote({
          adminName: user.name,
          hackerFullName: hacker.fullName,
          hackerGithub: hacker.github,
          submissionId,
          submissionUrl,
          submissionType,
          noteBody: body.trim(),
          countryCode: submissionDetails.submission.country,
        });
      }
    }

    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      note,
    };
  } catch (error) {
    console.error('Add hacker note error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add note',
    };
  }
}
