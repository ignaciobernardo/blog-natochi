import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { getAllMentors } from '@/src/queries/mentors';
import { CreateMentorDialog } from './_components/create-mentor-dialog';
import { MentorsTable } from './_components/mentors-table';

export const metadata = generateAdminMetadata('Mentors');

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function MentorsPage({ params }: PageProps) {
  const { eventSlug } = await params;
  const event = await getAdminEventBySlug(eventSlug);
  const mentors = await getAllMentors(event.id);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Mentors</h1>
          <p className="text-muted-foreground">
            Manage hackathon mentors for {event.name}
          </p>
        </div>
        <CreateMentorDialog eventSlug={eventSlug} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Mentors ({mentors.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MentorsTable eventSlug={eventSlug} mentors={mentors} />
        </CardContent>
      </Card>
    </div>
  );
}
