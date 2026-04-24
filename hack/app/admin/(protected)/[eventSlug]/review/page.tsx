import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { submissionReviewSearchParamsSchema } from '@/src/lib/schemas/submission-review.schema';
import {
  getSubmissionsForReview,
  getUniqueCountriesForReviewSubmissions,
} from '@/src/queries/submissions';
import { SubmissionReviewFilters } from './_components/submission-review-filters';
import { SubmissionReviewTable } from './_components/submission-review-table';

export const metadata = generateAdminMetadata('Submission Review');

interface PageProps {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SubmissionReviewPage({
  params,
  searchParams,
}: PageProps) {
  const { eventSlug } = await params;
  const awaitedParams = await searchParams;
  const event = await getAdminEventBySlug(eventSlug);

  const parsedParams = submissionReviewSearchParamsSchema.parse({
    page: awaitedParams.page,
    limit: awaitedParams.limit,
    search: awaitedParams.search,
    eventId: event.id,
    status: awaitedParams.status,
    cohort: awaitedParams.cohort,
    modality: awaitedParams.modality,
    qualification: awaitedParams.qualification,
    country: awaitedParams.country,
    hasFlightRequest: awaitedParams.hasFlightRequest,
    hasReview: awaitedParams.hasReview,
    hasWomen: awaitedParams.hasWomen,
    submittedAfter: awaitedParams.submittedAfter,
    submittedBefore: awaitedParams.submittedBefore,
    sortBy: awaitedParams.sortBy,
    sortOrder: awaitedParams.sortOrder,
  });

  const { submissions, pagination } = await getSubmissionsForReview({
    page: parsedParams.page,
    limit: parsedParams.limit,
    search: parsedParams.search,
    eventId: parsedParams.eventId,
    status: parsedParams.status,
    cohort: parsedParams.cohort,
    modality: parsedParams.modality,
    qualification: parsedParams.qualification,
    country: parsedParams.country,
    hasFlightRequest: parsedParams.hasFlightRequest,
    hasReview: parsedParams.hasReview,
    hasWomen: parsedParams.hasWomen,
    submittedAfter: parsedParams.submittedAfter,
    submittedBefore: parsedParams.submittedBefore,
    sortBy: parsedParams.sortBy,
    sortOrder: parsedParams.sortOrder,
  });

  const uniqueCountries = await getUniqueCountriesForReviewSubmissions(
    parsedParams.eventId || '',
  );

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Submission Review</h1>
        <p className="text-muted-foreground">
          Review and manage all submissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading filters...</div>}>
            <SubmissionReviewFilters
              eventSlug={eventSlug}
              initialParams={parsedParams}
              countries={uniqueCountries}
            />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <SubmissionReviewTable
            eventSlug={eventSlug}
            submissions={submissions}
            pagination={pagination}
            currentParams={parsedParams}
          />
        </CardContent>
      </Card>
    </div>
  );
}
