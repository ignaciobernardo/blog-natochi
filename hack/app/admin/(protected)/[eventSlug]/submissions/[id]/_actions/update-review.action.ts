'use server';

import { eq } from 'drizzle-orm';
import { revalidateAdminSubmissionPaths } from '@/src/lib/admin/revalidate';
import { onlyAdmin } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import type { ReviewQualification } from '@/src/lib/db/schema';
import { reviews } from '@/src/lib/db/schema';
import { reviewNotifier } from '@/src/operators/slack/review-notifier';

export async function updateReviewAction(
  reviewId: string,
  submissionId: string,
  newQualification: ReviewQualification,
) {
  try {
    const user = await onlyAdmin();

    if (!user.linkedId) {
      return {
        success: false,
        error: 'Admin user not properly configured',
      };
    }

    // Verify the review belongs to the current user
    const review = await db.query.reviews.findFirst({
      where: (reviewsTable, { eq: eqOp }) => eqOp(reviewsTable.id, reviewId),
    });

    if (!review) {
      return {
        success: false,
        error: 'Review not found',
      };
    }

    if (review.reviewerId !== user.linkedId) {
      return {
        success: false,
        error: 'You can only edit your own reviews',
      };
    }

    // Update the review
    const [updatedReview] = await db
      .update(reviews)
      .set({ qualification: newQualification })
      .where(eq(reviews.id, reviewId))
      .returning();

    // Send Slack notification
    await reviewNotifier.notifyNewReview({
      adminName: user.name,
      submissionId,
      qualification: newQualification,
    });

    await revalidateAdminSubmissionPaths(submissionId);

    return {
      success: true,
      review: updatedReview,
    };
  } catch (error) {
    console.error('Update review error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update review',
    };
  }
}
