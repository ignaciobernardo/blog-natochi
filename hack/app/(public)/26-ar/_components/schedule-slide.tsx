import { HACK_26_AR } from '@/src/lib/constants';
import type { TimeSlot } from '@/src/lib/db/schema';
import { getEventBySlug } from '@/src/queries/events';
import { getTimeSlotsByEvent } from '@/src/queries/time-slots';
import { type ScheduleDay, ScheduleDays } from './schedule-days';

const TZ = 'America/Argentina/Buenos_Aires';

const DAY_LABELS: Record<string, { label: string; shortLabel: string }> = {
  '2026-05-08': { label: 'Viernes 8', shortLabel: 'Vie 8' },
  '2026-05-09': { label: 'Sábado 9', shortLabel: 'Sáb 9' },
  '2026-05-10': { label: 'Domingo 10', shortLabel: 'Dom 10' },
};

function formatDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function groupByDay(slots: TimeSlot[]): Map<string, TimeSlot[]> {
  const groups = new Map<string, TimeSlot[]>();
  for (const slot of slots) {
    const key = formatDayKey(new Date(slot.startTime));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(slot);
  }
  for (const value of groups.values()) {
    value.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  }
  return groups;
}

export async function ScheduleSlide() {
  const event = await getEventBySlug(HACK_26_AR.slug);

  if (!event) {
    return null;
  }

  const slots = await getTimeSlotsByEvent(event.id);

  if (slots.length === 0) {
    return null;
  }

  const grouped = groupByDay(slots);
  const dayKeys = Array.from(grouped.keys()).sort();

  const days: ScheduleDay[] = dayKeys.map((dayKey) => ({
    key: dayKey,
    label: DAY_LABELS[dayKey]?.label ?? dayKey,
    slots: grouped.get(dayKey) ?? [],
  }));

  return (
    <section className="selection-on-light flex w-full flex-col items-center justify-center bg-primary px-6 py-16 text-background sm:px-10 md:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-center font-bold font-title text-5xl leading-tight sm:text-6xl md:text-7xl">
          <span className="inline-block bg-background px-3 py-1 text-primary sm:px-4 sm:py-1.5">
            cronograma
          </span>
        </h2>
        <p className="mt-4 text-center font-mono text-background/70 text-sm md:text-base">
          8-10 de mayo, 2026 • Buenos Aires, Argentina
        </p>

        <ScheduleDays days={days} />
      </div>
    </section>
  );
}

export function ScheduleSlideFallback() {
  return (
    <section className="selection-on-light flex w-full flex-col items-center justify-center bg-primary px-6 py-16 text-background sm:px-10 md:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-center font-bold font-title text-5xl leading-tight sm:text-6xl md:text-7xl">
          <span className="inline-block bg-background px-3 py-1 text-primary sm:px-4 sm:py-1.5">
            cronograma
          </span>
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex h-80 animate-pulse flex-col border-2 border-background/40 bg-background/5"
            >
              <div className="h-12 border-background/40 border-b-2 bg-background/20" />
              <div className="flex-1" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
