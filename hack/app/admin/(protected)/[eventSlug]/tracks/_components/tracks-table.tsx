'use client';

import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { toast } from '@/src/components/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import type { Track } from '@/src/lib/db/schema';
import { deleteTrackAction } from '../_actions/track.actions';
import { EditTrackDialog } from './edit-track-dialog';

interface TracksTableProps {
  eventSlug: string;
  tracks: Track[];
}

export function TracksTable({ eventSlug, tracks }: TracksTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTrack, setEditTrack] = useState<Track | null>(null);

  const handleDelete = () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteTrackAction(deleteId, eventSlug);
      if (result.success) {
        toast({ type: 'success', description: 'Track deleted successfully' });
      } else {
        toast({
          type: 'error',
          description: result.error || 'Failed to delete track',
        });
      }
      setDeleteId(null);
    });
  };

  if (tracks.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No tracks found. Create one to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tracks.map((track) => (
              <TableRow key={track.id}>
                <TableCell>
                  <Link
                    href={getAdminEventPath(eventSlug, 'tracks', track.id)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {track.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {track.description || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={getAdminEventPath(eventSlug, 'tracks', track.id)}
                      >
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditTrack(track)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(track.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this track? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditTrackDialog
        eventSlug={eventSlug}
        track={editTrack}
        open={!!editTrack}
        onOpenChange={(open) => !open && setEditTrack(null)}
      />
    </>
  );
}
