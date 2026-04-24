'use server';

import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { archiveSubmission } from '@/src/queries/submissions';

interface ArchiveSubmissionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function archiveSubmissionAction(
  submissionId: string,
): Promise<ArchiveSubmissionResult> {
  try {
    // Verify admin has full permissions and get user
    const user = await onlyAdminFull();

    // Get current admin ID
    const adminId = user?.linkedId || undefined;

    // Archive submission
    const result = await archiveSubmission(submissionId, adminId);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error('Error archiving submission:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to archive submission. Please try again.',
    };
  }
}
