'use client';

import { useEffect, useRef, useState } from 'react';
import { TimeSlotDetailDialog } from '@/src/components/time-slot-detail-dialog';
import type { TimeSlot } from '@/src/lib/db/schema';

interface ScheduleProps {
  timeSlots: TimeSlot[];
  className?: string;
}

const DAYS = [
  { date: '2025-11-21', label: 'Viernes 21', shortLabel: 'Vie 21' },
  { date: '2025-11-22', label: 'Sábado 22', shortLabel: 'Sáb 22' },
  { date: '2025-11-23', label: 'Domingo 23', shortLabel: 'Dom 23' },
] as const;

const EVENT_START = new Date('2025-11-21T18:30:00-03:00');
const EVENT_END = new Date('2025-11-23T15:30:00-03:00');

const HOUR_HEIGHT = 80;

function getHourLabel(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function calculatePosition(date: Date, dayStart: Date): number {
  const diff = date.getTime() - dayStart.getTime();
  const hours = diff / (1000 * 60 * 60);
  return hours * HOUR_HEIGHT;
}

function isWithinEventHours(date: Date): boolean {
  return date >= EVENT_START && date <= EVENT_END;
}

function getCurrentTimePosition(): { day: number; position: number } | null {
  const now = new Date();

  if (!isWithinEventHours(now)) {
    return null;
  }

  for (let i = 0; i < DAYS.length; i++) {
    const dayStart = new Date(`${DAYS[i].date}T00:00:00-03:00`);
    const dayEnd = new Date(`${DAYS[i].date}T23:59:59-03:00`);

    if (now >= dayStart && now <= dayEnd) {
      return {
        day: i,
        position: calculatePosition(now, dayStart),
      };
    }
  }

  return null;
}

export function Schedule({ timeSlots, className = '' }: ScheduleProps) {
  const [currentTime, setCurrentTime] = useState<{
    day: number;
    position: number;
  } | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const handleTimeSlotClick = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(getCurrentTimePosition());
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentTime && scrollContainerRef.current && !hasScrolledRef.current) {
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const scrollPosition =
        rect.top + window.scrollY + currentTime.position - 200;
      window.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' });
      hasScrolledRef.current = true;
    }
  }, [currentTime]);

  const slotsByDay = DAYS.map((day) => {
    const dayStart = new Date(`${day.date}T00:00:00-03:00`);
    const dayEnd = new Date(`${day.date}T23:59:59-03:00`);

    return timeSlots.filter((slot) => {
      const slotStart = new Date(slot.startTime);
      return slotStart >= dayStart && slotStart <= dayEnd;
    });
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="overflow-x-auto border-2 border-primary bg-background md:overflow-x-visible">
        <div className="sticky top-0 z-10 grid min-w-[800px] grid-cols-[80px_1fr_1fr_1fr] border-primary border-b-2 bg-background md:min-w-0">
          <div className="sticky left-0 z-20 border-primary border-r-2 bg-background p-4">
            <span className="font-bold font-title text-primary text-sm md:text-base">
              Hora
            </span>
          </div>
          {DAYS.map((day) => (
            <div
              key={day.date}
              className="border-primary border-r-2 p-4 text-center last:border-r-0"
            >
              <h3 className="font-bold font-title text-primary text-sm md:text-base lg:text-lg">
                <span className="hidden sm:inline">{day.label}</span>
                <span className="sm:hidden">{day.shortLabel}</span>
              </h3>
            </div>
          ))}
        </div>

        <div ref={scrollContainerRef} className="relative">
          <div className="grid min-w-[800px] grid-cols-[80px_1fr_1fr_1fr] md:min-w-0">
            <div className="sticky left-0 z-10 border-primary border-r-2 bg-background">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-primary border-b"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <div className="p-2 font-mono text-primary text-xs md:text-sm">
                    {getHourLabel(hour)}
                  </div>
                </div>
              ))}
            </div>

            {DAYS.map((day, dayIndex) => {
              const dayStart = new Date(`${day.date}T00:00:00-03:00`);
              const slots = slotsByDay[dayIndex];

              const slotsByStartTime = new Map<number, TimeSlot[]>();
              slots.forEach((slot) => {
                const position = calculatePosition(
                  new Date(slot.startTime),
                  dayStart,
                );
                if (!slotsByStartTime.has(position)) {
                  slotsByStartTime.set(position, []);
                }
                slotsByStartTime.get(position)?.push(slot);
              });

              return (
                <div
                  key={day.date}
                  className="relative border-primary border-r-2 last:border-r-0"
                >
                  {hours.map((hour) => {
                    const hourDate = new Date(
                      `${day.date}T${getHourLabel(hour)}-03:00`,
                    );
                    const isOutsideEvent = !isWithinEventHours(hourDate);

                    return (
                      <div
                        key={hour}
                        className={`border-primary border-b ${
                          isOutsideEvent ? 'bg-primary/5' : ''
                        }`}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                      />
                    );
                  })}

                  {Array.from(slotsByStartTime.entries()).map(
                    ([position, overlappingSlots]) => {
                      const slotWidth = 100 / overlappingSlots.length;

                      return overlappingSlots.map((slot, index) => {
                        const start = new Date(slot.startTime);
                        const end = new Date(slot.endTime);
                        const duration =
                          (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        const height = duration * HOUR_HEIGHT;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => handleTimeSlotClick(slot)}
                            className="absolute cursor-pointer border-2 border-background p-2 text-left transition-all hover:z-10 hover:scale-105"
                            style={{
                              top: `${position}px`,
                              left: `${index * slotWidth}%`,
                              width: `${slotWidth}%`,
                              height: `${height}px`,
                              backgroundColor: slot.color,
                            }}
                          >
                            <div className="flex h-full flex-col gap-1 overflow-hidden">
                              <h4 className="line-clamp-1 font-bold font-title text-background text-xs md:text-sm">
                                {slot.title}
                              </h4>
                              {height > 40 && slot.location && (
                                <p className="line-clamp-1 font-mono text-background/90 text-xs">
                                  📍 {slot.location}
                                </p>
                              )}
                              {height > 60 && slot.description && (
                                <p className="line-clamp-2 font-mono text-background/80 text-xs">
                                  {slot.description}
                                </p>
                              )}
                              {height > 80 && slot.target.length > 0 && (
                                <div className="mt-auto flex flex-wrap gap-1">
                                  {slot.target.map((target) => (
                                    <span
                                      key={target}
                                      className="bg-background/20 px-1 py-0.5 font-mono text-background text-xs uppercase"
                                    >
                                      {target}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      });
                    },
                  )}

                  {currentTime && currentTime.day === dayIndex && (
                    <div
                      className="absolute left-0 z-20 w-full border-red-500 border-t-2"
                      style={{ top: `${currentTime.position}px` }}
                    >
                      <div className="-top-2 -left-2 absolute h-4 w-4 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TimeSlotDetailDialog
        timeSlot={selectedTimeSlot}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
