'use client';

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { deleteArcadeChallengeAction } from '../_actions/delete-arcade-challenge.action';

interface DeleteArcadeChallengeDialogProps {
  challengeId: string;
  challengeName: string;
}

export function DeleteArcadeChallengeDialog({
  challengeId,
  challengeName,
}: DeleteArcadeChallengeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteArcadeChallengeAction(challengeId);

      if (result.success) {
        setOpen(false);
        window.location.reload();
      } else {
        setError(result.error || 'Failed to delete arcade challenge');
      }
    });
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <AlertDialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Trash2 className="h-4 w-4 text-red-600" />
          <span className="sr-only">Delete arcade challenge</span>
        </Button>
      </AlertDialogPrimitive.Trigger>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <AlertDialogPrimitive.Content className="data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <AlertDialogPrimitive.Title className="font-semibold text-lg">
              Delete Arcade Challenge
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-muted-foreground text-sm">
              Are you sure you want to delete <strong>{challengeName}</strong>?
              This will also remove any games, versions, votes, and diagnostics
              linked to the challenge.
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
