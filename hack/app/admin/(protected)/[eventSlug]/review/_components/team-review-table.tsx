'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import type { SubmissionStatus } from '@/src/lib/db/schema';
import { getCountryDisplay } from '@/src/lib/utils/countries';
import type { SubmissionWithMembers } from '@/src/queries/submissions';

interface SubmissionReviewTableProps {
  eventSlug: string;
  submissions: SubmissionWithMembers[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    totalParticipants: number;
  };
  currentParams: {
    page: number;
    limit: number;
    sortBy: 'submittedAt';
    sortOrder: 'asc' | 'desc';
    search?: string;
    status?: SubmissionStatus[];
    submittedAfter?: Date;
    submittedBefore?: Date;
  };
}

export function SubmissionReviewTable({
  eventSlug,
  submissions,
  pagination,
  currentParams: _currentParams,
}: SubmissionReviewTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getReturnUrl = () => {
    const params = searchParams.toString();
    const basePath = getAdminEventPath(eventSlug, 'review');
    return params ? `${basePath}?${params}` : basePath;
  };

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const statusColors: Record<SubmissionStatus, string> = {
    received: 'bg-blue-100 text-blue-800 border-blue-300',
    priority_waiting: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    asking_self_finance_trip: 'bg-purple-100 text-purple-800 border-purple-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    onboarding_request: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    onboarding_expired: 'bg-gray-100 text-gray-800 border-gray-300',
    onboarding_complete: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    waiting_list: 'bg-amber-100 text-amber-800 border-amber-300',
    withdrawn: 'bg-orange-100 text-orange-800 border-orange-300',
    archived: 'bg-slate-100 text-slate-800 border-slate-300',
  };

  const statusLabels: Record<SubmissionStatus, string> = {
    received: 'Received',
    priority_waiting: 'Priority Waiting',
    asking_self_finance_trip: 'Asking Self Finance',
    approved: 'Approved',
    onboarding_request: 'Onboarding Request',
    onboarding_expired: 'Onboarding Expired',
    onboarding_complete: 'Onboarding Complete',
    rejected: 'Rejected',
    waiting_list: 'Waiting List',
    withdrawn: 'Withdrawn',
    archived: 'Archived',
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getGitHubAvatarUrl = (githubUsername: string | null) => {
    if (!githubUsername) return null;
    const username = githubUsername.replace(
      /^https?:\/\/(www\.)?github\.com\//,
      '',
    );
    return `https://github.com/${username}.png`;
  };

  if (submissions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No submissions found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Members</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Modality</TableHead>
              <TableHead>Cohort</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submissionData) => (
              <TableRow key={submissionData.submission.id}>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {[...submissionData.members]
                      .sort((a, b) => a.fullName.localeCompare(b.fullName))
                      .map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 rounded-md bg-muted px-2 py-1"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={
                                getGitHubAvatarUrl(member.github) || undefined
                              }
                              alt={member.fullName}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.fullName}</span>
                          {member.github && (
                            <a
                              href={
                                member.github.startsWith('http')
                                  ? member.github
                                  : `https://github.com/${member.github}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                  </div>
                </TableCell>
                <TableCell>
                  {submissionData.submission.country ? (
                    <Badge variant="outline">
                      {getCountryDisplay(submissionData.submission.country)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      submissionData.submission.modality === 'solo'
                        ? 'border-purple-300 bg-purple-100 text-purple-800'
                        : submissionData.submission.modality === 'team'
                          ? 'border-green-300 bg-green-100 text-green-800'
                          : 'border-amber-300 bg-amber-100 text-amber-800'
                    }
                  >
                    {submissionData.submission.modality === 'solo'
                      ? 'Solo'
                      : submissionData.submission.modality === 'team'
                        ? 'Team'
                        : 'Team Looking'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      submissionData.submission.cohort === 'priority'
                        ? 'border-orange-300 bg-orange-100 text-orange-800'
                        : 'border-blue-300 bg-blue-100 text-blue-800'
                    }
                  >
                    {submissionData.submission.cohort === 'priority'
                      ? 'Priority'
                      : 'Final'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {submissionData.members.some(
                      (member) => member.gender === 'female',
                    ) && (
                      <Badge
                        variant="outline"
                        className="border-pink-300 bg-pink-100 text-pink-800"
                      >
                        <UserRound className="mr-1 h-3 w-3" />
                        Woman
                      </Badge>
                    )}
                    {submissionData.hasFlightRequest && (
                      <Badge
                        variant="outline"
                        className="border-blue-300 bg-blue-100 text-blue-800"
                      >
                        ✈️ Asking Flight
                      </Badge>
                    )}
                    {submissionData.reviews.map((review) => (
                      <Badge
                        key={review.id}
                        variant="outline"
                        className={
                          review.qualification === 'hell_yes'
                            ? 'border-green-500 bg-green-100 text-green-800'
                            : review.qualification === 'yes'
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : review.qualification === 'maybe'
                                ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                                : review.qualification === 'no'
                                  ? 'border-red-300 bg-red-50 text-red-700'
                                  : 'border-red-500 bg-red-100 text-red-800'
                        }
                      >
                        {review.qualification === 'hell_yes'
                          ? '🔥 Hell Yes'
                          : review.qualification === 'yes'
                            ? '👍 Yes'
                            : review.qualification === 'maybe'
                              ? '🤔 Maybe'
                              : review.qualification === 'no'
                                ? '👎 No'
                                : '🚫 Hell No'}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[submissionData.submission.status]}
                  >
                    {statusLabels[submissionData.submission.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {submissionData.submission.submittedAt ? (
                    <div className="space-y-1">
                      <div className="text-sm">
                        {new Date(
                          submissionData.submission.submittedAt,
                        ).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: 'America/Santiago',
                        })}{' '}
                        {new Date(
                          submissionData.submission.submittedAt,
                        ).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                          timeZone: 'America/Santiago',
                        })}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatDistanceToNow(
                          new Date(submissionData.submission.submittedAt),
                          {
                            addSuffix: true,
                          },
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Not submitted
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={
                        `${getAdminEventPath(
                          eventSlug,
                          'submissions',
                          submissionData.submission.id,
                        )}?returnTo=${encodeURIComponent(getReturnUrl())}` as any
                      }
                    >
                      View Details
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-4">
        <div className="text-muted-foreground text-sm">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} submissions (
          {submissions.reduce((sum, s) => sum + s.members.length, 0)} of{' '}
          {pagination.totalParticipants} participants)
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((pageNum) => {
                if (pagination.totalPages <= 7) return true;
                if (pageNum === 1 || pageNum === pagination.totalPages)
                  return true;
                if (
                  pageNum >= pagination.page - 1 &&
                  pageNum <= pagination.page + 1
                )
                  return true;
                return false;
              })
              .map((pageNum, index, array) => {
                const showEllipsis =
                  index > 0 && pageNum - array[index - 1] > 1;

                return (
                  <div key={pageNum} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={
                        pageNum === pagination.page ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => changePage(pageNum)}
                      className="min-w-[2.5rem]"
                    >
                      {pageNum}
                    </Button>
                  </div>
                );
              })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { SubmissionReviewTable as TeamReviewTable };
