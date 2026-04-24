'use client';

import { CheckCircle, Clock, Edit2, Plane, UserX, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import type {
  Cohort,
  ReviewQualification,
  SubmissionStatus,
} from '@/src/lib/db/schema';
import { addReviewAction } from '../_actions/add-review.action';
import { passToApprovedAction } from '../_actions/pass-to-approved.action';
import { passToAskingSelfFinanceTripAction } from '../_actions/pass-to-asking-self-finance-trip.action';
import { passToPriorityWaitingAction } from '../_actions/pass-to-priority-waiting.action';
import { passToRejectedAction } from '../_actions/pass-to-rejected.action';
import { passToWithdrawnAction } from '../_actions/pass-to-withdrawn.action';
import { updateReviewAction } from '../_actions/update-review.action';

const qualifications: Array<{
  value: ReviewQualification;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
}> = [
  {
    value: 'hell_yes',
    label: 'Hell Yes',
    emoji: '🔥',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    value: 'yes',
    label: 'Yes',
    emoji: '✅',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    value: 'maybe',
    label: 'Maybe',
    emoji: '🤔',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    value: 'no',
    label: 'No',
    emoji: '❌',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    value: 'hell_no',
    label: 'Hell No',
    emoji: '💀',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
  },
];

interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  qualification: string;
  createdAt: Date;
  reviewer: {
    fullName: string;
    email: string;
  };
}

interface TeamReviewProps {
  submissionId: string;
  reviews: Review[];
  currentUserId?: string;
  submissionStatus: SubmissionStatus;
  submissionCohort: Cohort;
  submissionCountry: string;
  hasFlightRequests: boolean;
}

export function TeamReview({
  submissionId,
  reviews,
  currentUserId,
  submissionStatus,
  submissionCohort,
  submissionCountry,
  hasFlightRequests,
}: TeamReviewProps) {
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<{ success: boolean; error?: string }>({
    success: false,
  });
  const [allReviews, setAllReviews] = useState<Review[]>(reviews);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [statusActionPending, setStatusActionPending] = useState(false);

  useEffect(() => {
    setAllReviews(reviews);
  }, [reviews]);

  const hasCurrentUserReview = currentUserId
    ? allReviews.some((r) => r.reviewerId === currentUserId)
    : false;

  const _currentUserReview = currentUserId
    ? allReviews.find((r) => r.reviewerId === currentUserId)
    : null;

  const handleReview = async (qualification: ReviewQualification) => {
    setIsPending(true);
    const result = await addReviewAction(submissionId, qualification);
    setState(result);
    if (result.success) {
      // Refresh the page to show new review
      window.location.reload();
    }
    setIsPending(false);
  };

  const handleEditReview = async (
    reviewId: string,
    qualification: ReviewQualification,
  ) => {
    setIsPending(true);
    const result = await updateReviewAction(
      reviewId,
      submissionId,
      qualification,
    );
    setState(result);
    if (result.success) {
      // Refresh the page to show updated review
      window.location.reload();
    }
    setEditingReviewId(null);
    setIsPending(false);
  };

  const getQualificationLabel = (value: string) => {
    const qual = qualifications.find((q) => q.value === value);
    return qual?.label || value;
  };

  const getQualificationEmoji = (value: string) => {
    const qual = qualifications.find((q) => q.value === value);
    return qual?.emoji || '';
  };

  const handleStatusChange = async (
    action: () => Promise<{
      success: boolean;
      error?: string;
      message?: string;
    }>,
  ) => {
    setStatusActionPending(true);
    const result = await action();
    if (result.success) {
      window.location.reload();
    } else {
      setState({ success: false, error: result.error });
    }
    setStatusActionPending(false);
  };

  const hasReviews = allReviews.length > 0;
  const canChangeStatus =
    (submissionStatus === 'received' ||
      submissionStatus === 'priority_waiting' ||
      submissionStatus === 'waiting_list') &&
    hasReviews;
  const canMoveToPriorityWaiting =
    submissionStatus === 'received' &&
    hasReviews &&
    submissionCohort === 'priority';
  const canAskSelfFinanceTrip =
    (submissionStatus === 'received' ||
      submissionStatus === 'priority_waiting') &&
    hasReviews &&
    (submissionCountry.toLowerCase() !== 'cl' || hasFlightRequests);
  const canWithdraw =
    submissionStatus === 'approved' ||
    submissionStatus === 'onboarding_request' ||
    submissionStatus === 'onboarding_expired' ||
    submissionStatus === 'onboarding_complete';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Review Submission</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasCurrentUserReview && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isPending}>
                  Rate Submission
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {qualifications.map((q) => (
                  <DropdownMenuItem
                    key={q.value}
                    onClick={() => handleReview(q.value)}
                    disabled={isPending}
                    className={`cursor-pointer ${q.color}`}
                  >
                    <span className="mr-2">{q.emoji}</span>
                    {q.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {state.success && (
              <div className="text-green-600 text-sm">✓ Review submitted</div>
            )}
            {state.error && (
              <div className="text-red-600 text-sm">{state.error}</div>
            )}
          </div>
        )}

        {hasCurrentUserReview && (
          <div className="text-muted-foreground text-sm">
            You have already reviewed this submission
          </div>
        )}

        {allReviews.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="font-semibold text-sm">Votes ({allReviews.length})</p>
            <div className="space-y-2">
              {allReviews.map((review) => (
                <div key={review.id} className="space-y-1">
                  {editingReviewId === review.id ? (
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            className="flex items-center gap-1"
                          >
                            <span className="text-base">
                              {getQualificationEmoji(review.qualification)}
                            </span>
                            {getQualificationLabel(review.qualification)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {qualifications.map((q) => (
                            <DropdownMenuItem
                              key={q.value}
                              onClick={() =>
                                handleEditReview(review.id, q.value)
                              }
                              disabled={isPending}
                              className={`cursor-pointer ${q.color}`}
                            >
                              <span className="mr-2">{q.emoji}</span>
                              {q.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingReviewId(null)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getQualificationEmoji(review.qualification)}
                        </span>
                        <div>
                          <p className="font-medium text-sm">
                            {review.reviewer.fullName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {review.reviewer.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {getQualificationLabel(review.qualification)}
                        </span>
                        {review.reviewerId === currentUserId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingReviewId(review.id)}
                            disabled={isPending}
                            className="h-6 w-6 p-0"
                            title="Edit review"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {canChangeStatus && (
          <div className="space-y-3 border-t pt-4">
            <p className="font-semibold text-sm">Status Actions</p>
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={statusActionPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve this submission? This
                      will change the status to "approved" and notify the team.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleStatusChange(() =>
                          passToApprovedAction(submissionId),
                        )
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={statusActionPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this submission? This
                      action will change the status to "rejected" and notify the
                      team.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleStatusChange(() =>
                          passToRejectedAction(submissionId),
                        )
                      }
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {canAskSelfFinanceTrip && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={statusActionPending}
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    >
                      <Plane className="mr-2 h-4 w-4" />
                      Ask Self Finance Trip
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Ask Team to Self-Finance Trip
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will send an email asking if the team can
                        self-finance their trip to Chile. They will have 48
                        hours to respond. If they accept, they will be approved.
                        If they decline or don't respond, they will be rejected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          handleStatusChange(() =>
                            passToAskingSelfFinanceTripAction(submissionId),
                          )
                        }
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Send Request
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {canMoveToPriorityWaiting && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={statusActionPending}
                      className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Move to Priority Waiting
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Move to Priority Waiting
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to move this submission to
                        priority waiting? This will put the submission on hold
                        for further review.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          handleStatusChange(() =>
                            passToPriorityWaitingAction(submissionId),
                          )
                        }
                      >
                        Move to Waiting
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            {state.error && (
              <div className="text-red-600 text-sm">{state.error}</div>
            )}
          </div>
        )}

        {canWithdraw && (
          <div className="space-y-3 border-t pt-4">
            <p className="font-semibold text-sm">Withdrawal</p>
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={statusActionPending}
                    className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Withdraw Submission
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Withdraw Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to withdraw this submission? This
                      will mark the submission as withdrawn and notify the team
                      that their application has been closed to give space to
                      other teams.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleStatusChange(() =>
                          passToWithdrawnAction(submissionId),
                        )
                      }
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Withdraw
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {state.error && (
              <div className="text-red-600 text-sm">{state.error}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
