import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { getAllTracks } from '@/src/queries/tracks';
import { CreateTrackDialog } from './_components/create-track-dialog';
import { TracksTable } from './_components/tracks-table';

export const metadata = generateAdminMetadata('Tracks');

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function TracksPage({ params }: PageProps) {
  const { eventSlug } = await params;
  const event = await getAdminEventBySlug(eventSlug);
  const tracks = await getAllTracks(event.id);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Tracks</h1>
          <p className="text-muted-foreground">
            Manage hackathon tracks for {event.name}
          </p>
        </div>
        <CreateTrackDialog eventSlug={eventSlug} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tracks ({tracks.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TracksTable eventSlug={eventSlug} tracks={tracks} />
        </CardContent>
      </Card>
    </div>
  );
}
