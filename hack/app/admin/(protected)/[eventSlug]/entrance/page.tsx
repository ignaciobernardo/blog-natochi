import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { entranceSearchParamsSchema } from '@/src/lib/schemas/entrance.schema';
import {
  getEntranceStats,
  searchPeopleForEntrance,
} from '@/src/queries/entrances';
import { EntranceSearch } from './_components/entrance-search';
import { EntranceTable } from './_components/entrance-table';

export const metadata = generateAdminMetadata('Entrance');

interface PageProps {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EntrancePage({
  params,
  searchParams,
}: PageProps) {
  const { eventSlug } = await params;
  const awaitedParams = await searchParams;
  const event = await getAdminEventBySlug(eventSlug);

  const parsedParams = entranceSearchParamsSchema.parse({
    search: awaitedParams.search,
    eventId: event.id,
  });

  const [people, stats] = await Promise.all([
    parsedParams.eventId
      ? searchPeopleForEntrance({
          eventId: parsedParams.eventId,
          search: parsedParams.search,
        })
      : [],
    parsedParams.eventId
      ? getEntranceStats(parsedParams.eventId)
      : {
          totalHackers: 0,
          totalMentors: 0,
          totalPeople: 0,
          totalEntered: 0,
          percentage: 0,
        },
  ]);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Entrance</h1>
        <p className="text-muted-foreground">Register entrances to the event</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading search...</div>}>
            <EntranceSearch currentSearch={parsedParams.search} stats={stats} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <EntranceTable people={people} eventId={parsedParams.eventId || ''} />
        </CardContent>
      </Card>
    </div>
  );
}
