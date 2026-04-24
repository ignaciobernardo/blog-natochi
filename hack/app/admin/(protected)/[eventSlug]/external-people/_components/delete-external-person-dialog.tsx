'use client';

import { Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
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
import { deleteExternalPersonAction } from '../_actions/delete-external-person.action';

interface DeleteExternalPersonDialogProps {
  eventId: string;
  eventSlug: string;
  personId: string;
  personName: string;
}

export function DeleteExternalPersonDialog({
  eventId,
  eventSlug,
  personId,
  personName,
}: DeleteExternalPersonDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteExternalPersonAction(
        personId,
        eventId,
        eventSlug,
      );
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error ?? 'Failed to delete');
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete External Person</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{personName}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
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
    </>
  );
}
