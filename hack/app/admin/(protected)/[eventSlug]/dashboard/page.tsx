import { Suspense } from 'react';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { ApprovedAgeDistribution } from './_components/approved-age-distribution';
import { ApprovedCountryBreakdown } from './_components/approved-country-breakdown';
import { ApprovedStatsCards } from './_components/approved-stats-cards';
import { CountryParticipants } from './_components/country-participants';
import { ReviewDistribution } from './_components/review-distribution';
import { StatsCards } from './_components/stats-cards';
import { StatCardSkeleton } from './_components/stats-skeleton';
import { StatusBreakdown } from './_components/status-breakdown';
import { SubmissionTimeline } from './_components/submission-timeline';
import { TimelineSkeleton } from './_components/timeline-skeleton';

export const metadata = generateAdminMetadata('Dashboard');

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { eventSlug } = await params;
  const event = await getAdminEventBySlug(eventSlug);
  const eventId = event.id;

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">{event.name} admin overview</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-xl">All Applicants</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Suspense
            fallback={
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            }
          >
            <StatsCards eventId={eventId} />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Suspense fallback={<TimelineSkeleton />}>
            <ReviewDistribution eventId={eventId} />
          </Suspense>

          <Suspense fallback={<TimelineSkeleton />}>
            <CountryParticipants eventId={eventId} />
          </Suspense>
        </div>

        <Suspense fallback={<TimelineSkeleton />}>
          <SubmissionTimeline eventId={eventId} />
        </Suspense>

        <Suspense fallback={<TimelineSkeleton />}>
          <StatusBreakdown eventId={eventId} />
        </Suspense>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-xl">Approved Hackers</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Suspense
            fallback={
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            }
          >
            <ApprovedStatsCards eventId={eventId} />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<TimelineSkeleton />}>
          <ApprovedAgeDistribution eventId={eventId} />
        </Suspense>

        <Suspense fallback={<TimelineSkeleton />}>
          <ApprovedCountryBreakdown eventId={eventId} />
        </Suspense>
      </div>
    </div>
  );
}
