'use client';

import { useEffect, useRef, useState } from 'react';
import { TimeSlotDetailDialog } from '@/src/components/time-slot-detail-dialog';
import type { TimeSlot } from '@/src/lib/db/schema';

const TZ = 'America/Argentina/Buenos_Aires';

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export type ScheduleDay = {
  key: string;
  label: string;
  slots: TimeSlot[];
};

type Props = {
  days: ScheduleDay[];
};

export function ScheduleDays({ days }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsDialogOpen(true);
  };

  let slotIndex = 0;

  return (
    <>
      <div ref={gridRef} className="mt-10 grid gap-6 md:grid-cols-3">
        {days.map((day, dayIndex) => (
          <div
            key={day.key}
            className={`flex transform-gpu flex-col border-2 border-background bg-primary transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0'
            }`}
            style={{ transitionDelay: `${dayIndex * 110}ms` }}
          >
            <div className="border-background border-b-2 bg-background px-4 py-3">
              <h3 className="font-bold font-title text-lg text-primary md:text-xl">
                {day.label}
              </h3>
            </div>
            <ul className="flex flex-col divide-y-2 divide-background/15">
              {day.slots.map((slot) => {
                const delayMs = 240 + slotIndex * 35;
                slotIndex += 1;

                return (
                  <li key={slot.id}>
                    <button
                      type="button"
                      onClick={() => handleSlotClick(slot)}
                      className={`group flex w-full transform-gpu flex-col gap-1 px-4 py-3 text-left transition-[opacity,transform,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:bg-background/10 ${
                        isVisible
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-3 opacity-0'
                      }`}
                      style={{ transitionDelay: `${delayMs}ms` }}
                    >
                      <span className="font-mono text-background/70 text-xs">
                        {formatTime(new Date(slot.startTime))}–
                        {formatTime(new Date(slot.endTime))}
                      </span>
                      <p className="font-bold font-title text-background text-sm transition-transform duration-300 group-hover:translate-x-1 md:text-base">
                        {slot.title}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <TimeSlotDetailDialog
        timeSlot={selectedSlot}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
