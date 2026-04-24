'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type { Event } from '@/src/lib/db/schema';
import { DeleteEventDialog } from './delete-event-dialog';
import { UpdateEventDialog } from './update-event-dialog';

interface EventsTableProps {
  events: Event[];
}

export function EventsTable({ events }: EventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No events found.</p>
      </div>
    );
  }

  const formatDateTime = (date: Date | null) => {
    if (!date) return <span className="text-muted-foreground text-sm">-</span>;

    return (
      <div className="space-y-1">
        <div className="text-sm">
          {new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Santiago',
          })}
        </div>
        <div className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Photos Album</TableHead>
              <TableHead>Starts At</TableHead>
              <TableHead>Ends At</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="font-medium text-sm">{event.name}</div>
                </TableCell>
                <TableCell>
                  {event.photosAlbumUrl ? (
                    <a
                      href={event.photosAlbumUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-sm underline"
                    >
                      Open album
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>{formatDateTime(event.startsAt)}</TableCell>
                <TableCell>{formatDateTime(event.endsAt)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {event.capacityTeams !== null && (
                      <div className="text-sm">
                        Teams: {event.capacityTeams}
                      </div>
                    )}
                    {event.capacityHackers !== null && (
                      <div className="text-sm">
                        Hackers: {event.capacityHackers}
                      </div>
                    )}
                    {event.targetSubmission !== null && (
                      <div className="text-sm">
                        Target: {event.targetSubmission}
                      </div>
                    )}
                    {event.capacityTeams === null &&
                      event.capacityHackers === null &&
                      event.targetSubmission === null && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <UpdateEventDialog event={event} />
                    <DeleteEventDialog
                      eventId={event.id}
                      eventName={event.name}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
