'use client';

import { UserCheck } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from '@/src/components/toast';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import type { Mentor } from '@/src/lib/db/schema';
import { updateTeamAction } from '../_actions/teams.actions';

interface AssignMentorDialogProps {
  teamId: string;
  currentMentorId: string | null;
  mentors: Mentor[];
}

export function AssignMentorDialog({
  teamId,
  currentMentorId,
  mentors,
}: AssignMentorDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(
    currentMentorId,
  );
  const [isPending, startTransition] = useTransition();

  const handleAssign = () => {
    startTransition(async () => {
      const result = await updateTeamAction(teamId, {
        mentorId: selectedMentorId,
      });

      if (result.success) {
        toast({
          type: 'success',
          description: selectedMentorId
            ? 'Mentor assigned successfully'
            : 'Mentor removed successfully',
        });
        setOpen(false);
      } else {
        toast({
          type: 'error',
          description: result.error || 'Failed to assign mentor',
        });
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        <UserCheck className="mr-2 h-4 w-4" />
        {currentMentorId ? 'Change Mentor' : 'Assign Mentor'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Mentor</DialogTitle>
            <DialogDescription>
              Select a mentor to assign to this team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={selectedMentorId || 'none'}
              onValueChange={(value) =>
                setSelectedMentorId(value === 'none' ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a mentor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No mentor</SelectItem>
                {mentors.map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id}>
                    {mentor.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={isPending}>
                {isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
