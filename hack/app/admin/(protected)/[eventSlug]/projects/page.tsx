import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { projectAdminSearchParamsSchema } from '@/src/lib/schemas/project-admin.schema';
import { getProjectsForAdmin } from '@/src/queries/projects';
import { ProjectFilters } from './_components/project-filters';
import { ProjectTable } from './_components/project-table';

export const metadata = generateAdminMetadata('Projects');

interface PageProps {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectsPage({
  params,
  searchParams,
}: PageProps) {
  const { eventSlug } = await params;
  const awaitedParams = await searchParams;
  const event = await getAdminEventBySlug(eventSlug);

  const parsedParams = projectAdminSearchParamsSchema.parse({
    page: awaitedParams.page,
    limit: awaitedParams.limit,
    search: awaitedParams.search,
    hasVideo: awaitedParams.hasVideo,
    hasRepo: awaitedParams.hasRepo,
    sortBy: awaitedParams.sortBy,
    sortOrder: awaitedParams.sortOrder,
  });

  const { projects, pagination } = await getProjectsForAdmin({
    eventId: event.id,
    page: parsedParams.page,
    limit: parsedParams.limit,
    search: parsedParams.search,
    hasVideo: parsedParams.hasVideo,
    hasRepo: parsedParams.hasRepo,
    sortBy: parsedParams.sortBy,
    sortOrder: parsedParams.sortOrder,
  });

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Projects</h1>
        <p className="text-muted-foreground">
          Review and manage project submissions for {event.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading filters...</div>}>
            <ProjectFilters
              eventSlug={eventSlug}
              initialParams={parsedParams}
            />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ProjectTable
            eventSlug={eventSlug}
            projects={projects}
            pagination={pagination}
          />
        </CardContent>
      </Card>
    </div>
  );
}
