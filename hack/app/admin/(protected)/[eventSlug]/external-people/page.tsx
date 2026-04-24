import { Card, CardContent, CardHeader } from '@/src/components/ui/card';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getAllExternalPeople } from '@/src/queries/external-people';
import { CreateExternalPersonDialog } from './_components/create-external-person-dialog';
import { ExternalPeopleSearch } from './_components/external-people-search';
import { ExternalPeopleTable } from './_components/external-people-table';

export const metadata = generateAdminMetadata('External People');

interface PageProps {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function ExternalPeoplePage({
  params,
  searchParams,
}: PageProps) {
  await onlyAdminFull();
  const { eventSlug } = await params;
  const { q } = await searchParams;
  const event = await getAdminEventBySlug(eventSlug);
  const search = q?.trim() ?? '';
  const people = await getAllExternalPeople(event.id, search || undefined);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">External People</h1>
          <p className="text-muted-foreground">
            Manage external participants for {event.name}
          </p>
        </div>
        <CreateExternalPersonDialog eventId={event.id} eventSlug={eventSlug} />
      </div>

      <Card>
        <CardHeader>
          <ExternalPeopleSearch />
          <p className="text-muted-foreground text-sm">
            {people.length} {people.length === 1 ? 'person' : 'people'} found
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ExternalPeopleTable eventSlug={eventSlug} people={people} />
        </CardContent>
      </Card>
    </div>
  );
}
