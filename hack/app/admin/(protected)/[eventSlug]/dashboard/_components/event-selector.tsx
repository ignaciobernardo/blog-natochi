'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import type { Event } from '@/src/lib/db/schema';

interface EventSelectorProps {
  events: Event[];
  currentEventId: string;
}

export function EventSelector({ events, currentEventId }: EventSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleEventChange = (eventId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('eventId', eventId);
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={currentEventId} onValueChange={handleEventChange}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select event" />
      </SelectTrigger>
      <SelectContent>
        {events.map((event) => (
          <SelectItem key={event.id} value={event.id}>
            {event.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
