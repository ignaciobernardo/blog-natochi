'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type { TimeSlot } from '@/src/lib/db/schema';
import { deleteTimeSlotAction } from '../_actions/delete-time-slot.action';
import { EditTimeSlotDialog } from './edit-time-slot-dialog';

interface TimeSlotsTableProps {
  timeSlots: TimeSlot[];
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TimeSlotsTable({ timeSlots }: TimeSlotsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) {
      return;
    }

    setDeletingId(id);
    const result = await deleteTimeSlotAction(id);

    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error || 'Failed to delete time slot');
      setDeletingId(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Target</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeSlots.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                No time slots found
              </TableCell>
            </TableRow>
          ) : (
            timeSlots.map((slot) => (
              <TableRow key={slot.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: slot.color }}
                    />
                    <span className="font-medium">{slot.title}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDateTime(slot.startTime)}</TableCell>
                <TableCell>{formatDateTime(slot.endTime)}</TableCell>
                <TableCell>{slot.location || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {slot.target.map((t) => (
                      <Badge key={t} variant="outline" className="capitalize">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSlot(slot)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(slot.id)}
                      disabled={deletingId === slot.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {editingSlot && (
        <EditTimeSlotDialog
          timeSlot={editingSlot}
          open={!!editingSlot}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </>
  );
}
