'use client';

import { Play } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { forceRunJobAction } from '../_actions/force-run-job.action';

interface ForceRunButtonProps {
  jobName: string;
  isOneOff?: boolean;
  description?: string;
  returnsDownload?: boolean;
}

export function ForceRunButton({
  jobName,
  isOneOff = false,
  description,
  returnsDownload = false,
}: ForceRunButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleForceRun = () => {
    startTransition(async () => {
      const result = await forceRunJobAction(jobName);

      if (!result.success) {
        toast.error(result.error || 'Failed to run job');
      } else {
        toast.success(result.message);

        // If job returns download data, trigger browser download
        if (returnsDownload && result.downloadData) {
          const blob = new Blob([result.downloadData], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${jobName}-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      }
      setOpen(false);
    });
  };

  const runButton = (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={isOneOff ? undefined : handleForceRun}
    >
      <Play className="h-4 w-4" />
      {isPending ? 'Running...' : 'Run Now'}
    </Button>
  );

  if (!isOneOff) {
    return runButton;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{runButton}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Run One-Off Action</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              Are you sure you want to run this one-off action? This action
              cannot be undone.
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="font-medium text-foreground">{jobName}</div>
              {description && (
                <div className="mt-1 text-muted-foreground text-sm">
                  {description}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleForceRun} disabled={isPending}>
            {isPending ? 'Running...' : 'Run Action'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
