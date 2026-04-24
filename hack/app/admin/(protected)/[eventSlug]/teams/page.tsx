import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { getAllTeams } from '@/src/queries/teams';
import { CreateTeamDialog } from './_components/create-team-dialog';
import { TeamsTable } from './_components/teams-table';

export const metadata = generateAdminMetadata('Teams');

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function TeamsPage({ params }: PageProps) {
  const { eventSlug } = await params;
  const event = await getAdminEventBySlug(eventSlug);
  const teams = await getAllTeams(event.id);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage hackathon teams and their members for {event.name}
          </p>
        </div>
        <CreateTeamDialog eventId={event.id} eventSlug={eventSlug} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teams ({teams.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TeamsTable eventSlug={eventSlug} teams={teams} />
        </CardContent>
      </Card>
    </div>
  );
}
