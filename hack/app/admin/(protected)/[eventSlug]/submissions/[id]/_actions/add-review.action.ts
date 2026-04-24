'use server';

import { and, eq } from 'drizzle-orm';
import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdmin } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import type { ReviewQualification } from '@/src/lib/db/schema';
import { reviews } from '@/src/lib/db/schema';
import { reviewNotifier } from '@/src/operators/slack/review-notifier';

export async function addReviewAction(
  submissionId: string,
  qualification: ReviewQualification,
) {
  try {
    const user = await onlyAdmin();

    if (!user.linkedId) {
      return {
        success: false,
        error: 'Admin user not properly configured',
      };
    }

    // Check if user already has a review for this submission
    const linkedId = user.linkedId;
    const existingReview = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.submissionId, submissionId),
          eq(reviews.reviewerId, linkedId),
        ),
      )
      .limit(1);

    if (existingReview.length > 0) {
      return {
        success: false,
        error: 'You have already reviewed this submission',
      };
    }

    // Create the review
    const [review] = await db
      .insert(reviews)
      .values({
        submissionId,
        reviewerId: linkedId,
        qualification,
      })
      .returning();

    // Send Slack notification
    await reviewNotifier.notifyNewReview({
      adminName: user.name,
      submissionId,
      qualification,
    });

    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      review,
    };
  } catch (error) {
    console.error('Add review error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add review',
    };
  }
}
