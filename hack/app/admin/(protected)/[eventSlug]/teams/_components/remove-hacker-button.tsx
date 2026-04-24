'use client';

import { X } from 'lucide-react';
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
import { removeHackerFromTeamAction } from '../_actions/teams.actions';

interface RemoveHackerButtonProps {
  hackerProfileId: string;
  hackerName: string;
  teamId: string;
}

export function RemoveHackerButton({
  hackerProfileId,
  hackerName,
  teamId,
}: RemoveHackerButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeHackerFromTeamAction(hackerProfileId, teamId);

      if (result.success) {
        toast({
          type: 'success',
          description: `${hackerName} removed from team successfully`,
        });
        setShowDialog(false);
      } else {
        toast({
          type: 'error',
          description: result.error || 'Failed to remove hacker from team',
        });
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={isPending}
      >
        <X className="h-4 w-4 text-red-500" />
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {hackerName} from this team? They
              will no longer be associated with this team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
