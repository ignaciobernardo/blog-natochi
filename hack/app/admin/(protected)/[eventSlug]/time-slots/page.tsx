import { Suspense } from 'react';
import { Schedule } from '@/src/components/schedule';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { onlyAdminFull } from '@/src/lib/auth/server';
import { getTimeSlotsByEvent } from '@/src/queries/time-slots';
import { CreateTimeSlotDialog } from './_components/create-time-slot-dialog';
import { TimeSlotsTable } from './_components/time-slots-table';

export const metadata = generateAdminMetadata('Time Slots');

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function TimeSlotsPage({ params }: PageProps) {
  await onlyAdminFull();
  const { eventSlug } = await params;
  const event = await getAdminEventBySlug(eventSlug);

  const timeSlots = await getTimeSlotsByEvent(event.id);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Time Slots</h1>
          <p className="text-muted-foreground">
            Manage event schedule and time slots for {event.name}
          </p>
        </div>
        <CreateTimeSlotDialog eventId={event.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Time Slots ({timeSlots.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<div>Loading time slots...</div>}>
            <TimeSlotsTable timeSlots={timeSlots} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Schedule timeSlots={timeSlots} />
        </CardContent>
      </Card>
    </div>
  );
}
