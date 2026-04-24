'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import type { TimeSlot } from '@/src/lib/db/schema';

interface TimeSlotDetailDialogProps {
  timeSlot: TimeSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(date);
}

export function TimeSlotDetailDialog({
  timeSlot,
  open,
  onOpenChange,
}: TimeSlotDetailDialogProps) {
  if (!timeSlot) {
    return null;
  }

  const startTime = new Date(timeSlot.startTime);
  const endTime = new Date(timeSlot.endTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl border-2"
        style={{ borderColor: timeSlot.color }}
      >
        <DialogHeader>
          <div
            className="mb-4 rounded-lg p-6"
            style={{ backgroundColor: timeSlot.color }}
          >
            <DialogTitle className="font-title text-2xl text-background md:text-3xl">
              {timeSlot.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="font-semibold font-title text-muted-foreground text-sm uppercase">
              Horario
            </h4>
            <div className="space-y-1">
              <p className="font-mono text-sm">
                <span className="font-semibold">Inicio:</span>{' '}
                {formatDateTime(startTime)}
              </p>
              <p className="font-mono text-sm">
                <span className="font-semibold">Fin:</span>{' '}
                {formatTime(endTime)}
              </p>
            </div>
          </div>

          {timeSlot.description && (
            <div className="space-y-2">
              <h4 className="font-semibold font-title text-muted-foreground text-sm uppercase">
                Descripción
              </h4>
              <p className="whitespace-pre-line font-mono text-sm leading-relaxed">
                {timeSlot.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
