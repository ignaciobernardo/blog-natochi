import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getAllEvents } from '@/src/queries/events';
import { CreateEventDialog } from './_components/create-event-dialog';
import { EventsTable } from './_components/events-table';

export const metadata = generateAdminMetadata('Events');

export default async function EventsPage() {
  await onlyAdminFull();
  const events = await getAllEvents();

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Manage hackathon events and their schedules
          </p>
        </div>
        <CreateEventDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Events ({events.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<div>Loading events...</div>}>
            <EventsTable events={events} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
