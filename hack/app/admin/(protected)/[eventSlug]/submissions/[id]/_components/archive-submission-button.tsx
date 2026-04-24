'use client';

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Archive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { cn } from '@/src/lib/utils';
import { archiveSubmissionAction } from '../_actions/delete-submission.action';

interface ArchiveSubmissionButtonProps {
  eventSlug: string;
  submissionId: string;
  memberNames: string;
}

export function ArchiveSubmissionButton({
  eventSlug,
  submissionId,
  memberNames,
}: ArchiveSubmissionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleArchive = () => {
    setError(null);
    startTransition(async () => {
      const result = await archiveSubmissionAction(submissionId);

      if (result.success) {
        setOpen(false);
        router.push(getAdminEventPath(eventSlug, 'review'));
        router.refresh();
      } else {
        setError(result.error || 'Failed to archive submission');
      }
    });
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <AlertDialogPrimitive.Trigger asChild>
        <Button variant="destructive" size="sm">
          <Archive className="mr-2 h-4 w-4" />
          Archive Submission
        </Button>
      </AlertDialogPrimitive.Trigger>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <AlertDialogPrimitive.Content className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <AlertDialogPrimitive.Title className="font-semibold text-lg">
              Archive Submission
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-muted-foreground text-sm">
              Are you sure you want to archive the submission from{' '}
              <strong>{memberNames}</strong>? This will:
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Change the submission status to "archived"</li>
                <li>Keep all data intact (reviews, notes, flight requests)</li>
                <li>Remove it from the active review list</li>
                <li>Allow you to restore it later if needed</li>
              </ul>
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
                handleArchive();
              }}
              disabled={isPending}
              className={cn(
                buttonVariants(),
                'bg-amber-600 hover:bg-amber-700',
              )}
            >
              {isPending ? 'Archiving...' : 'Archive Submission'}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
