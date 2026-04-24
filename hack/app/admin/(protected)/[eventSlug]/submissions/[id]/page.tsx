import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { onlyAdmin } from '@/src/lib/auth/server';
import { getEmailsForSubmissionMembers } from '@/src/queries/emails';
import {
  getDuplicateHackersInNewerSubmissions,
  getSubmissionDetails,
} from '@/src/queries/submissions';
import { ArchiveSubmissionButton } from './_components/archive-submission-button';
import { DuplicateHackersAlert } from './_components/duplicate-hackers-alert';
import { SubmissionEmails } from './_components/submission-emails';
import { TeamFlightRequests } from './_components/team-flight-requests';
import { TeamMembers } from './_components/team-members';
import { TeamNotes } from './_components/team-notes';
import { TeamOverview } from './_components/team-overview';
import { TeamReview } from './_components/team-review';
import { TeamStatusHistory } from './_components/team-status-history';
import { TeamSubmission } from './_components/team-submission';

interface PageProps {
  params: Promise<{ eventSlug: string; id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const submissionData = await getSubmissionDetails(id);

  if (!submissionData) {
    return generateAdminMetadata('Submission Not Found');
  }

  const githubUsernames = submissionData.members
    .map((m) => {
      if (!m.github) return null;
      const username = m.github.includes('github.com')
        ? m.github.split('/').pop()
        : m.github;
      return username;
    })
    .filter(Boolean)
    .join(', ');

  return generateAdminMetadata(
    `Submission - ${githubUsernames || 'No GitHub'}`,
  );
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { eventSlug, id } = await params;
  const awaitedSearchParams = await searchParams;
  const event = await getAdminEventBySlug(eventSlug);
  const [submissionData, submissionEmails, duplicateHackers] =
    await Promise.all([
      getSubmissionDetails(id),
      getEmailsForSubmissionMembers(id),
      getDuplicateHackersInNewerSubmissions(id),
    ]);
  const currentUser = await onlyAdmin();

  if (!submissionData || submissionData.submission.eventId !== event.id) {
    notFound();
  }

  const returnTo = (
    typeof awaitedSearchParams.returnTo === 'string'
      ? awaitedSearchParams.returnTo
      : getAdminEventPath(eventSlug, 'review')
  ) as any;

  const memberNames = submissionData.members.map((m) => m.fullName).join(', ');
  const isAdminFull = currentUser?.adminRole === 'full';

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={returnTo}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Review
            </Link>
          </Button>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Submission Details
            </h1>
            <p className="text-muted-foreground">{memberNames}</p>
          </div>
        </div>
        {isAdminFull && (
          <ArchiveSubmissionButton
            eventSlug={eventSlug}
            submissionId={submissionData.submission.id}
            memberNames={memberNames}
          />
        )}
      </div>

      <DuplicateHackersAlert duplicateHackers={duplicateHackers} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <TeamOverview submission={submissionData.submission} />
          <TeamMembers
            submissionId={submissionData.submission.id}
            members={submissionData.members}
            isAdminFull={isAdminFull}
          />
        </div>

        <div className="space-y-6">
          <TeamReview
            submissionId={submissionData.submission.id}
            reviews={submissionData.reviews}
            currentUserId={currentUser?.linkedId ?? undefined}
            submissionStatus={submissionData.submission.status}
            submissionCohort={submissionData.submission.cohort}
            submissionCountry={submissionData.submission.country}
            hasFlightRequests={submissionData.flightRequests.length > 0}
          />
          <TeamSubmission submission={submissionData.submission} />
          <TeamStatusHistory history={submissionData.statusHistory} />
          <SubmissionEmails emails={submissionEmails} />
          <TeamFlightRequests
            flightRequests={submissionData.flightRequests}
            submissionId={submissionData.submission.id}
          />
          <TeamNotes
            notes={submissionData.notes}
            submissionId={submissionData.submission.id}
          />
        </div>
      </div>
    </div>
  );
}
