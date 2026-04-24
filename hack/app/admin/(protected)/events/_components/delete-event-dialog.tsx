'use client';

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { deleteEventAction } from '../_actions/delete-event.action';

interface DeleteEventDialogProps {
  eventId: string;
  eventName: string;
}

export function DeleteEventDialog({
  eventId,
  eventName,
}: DeleteEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteEventAction(eventId);

      if (result.success) {
        setOpen(false);
        window.location.reload();
      } else {
        setError(result.error || 'Failed to delete event');
      }
    });
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <AlertDialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Trash2 className="h-4 w-4 text-red-600" />
          <span className="sr-only">Delete event</span>
        </Button>
      </AlertDialogPrimitive.Trigger>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <AlertDialogPrimitive.Content className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <AlertDialogPrimitive.Title className="font-semibold text-lg">
              Delete Event
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-muted-foreground text-sm">
              Are you sure you want to delete <strong>{eventName}</strong>? This
              action cannot be undone and will permanently remove the event and
              all associated data.
            </AlertDialogPrimitive.Description>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel
              disabled={isPending}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'mt-2 sm:mt-0',
              )}
            >
              Cancel
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className={cn(buttonVariants(), 'bg-red-600 hover:bg-red-700')}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
