'use client';

import { Calendar, ExternalLink, Pencil, Trash2 } from 'lucide-react';
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type { Mentor } from '@/src/lib/db/schema';
import { deleteMentorAction } from '../_actions/mentor.actions';
import { EditMentorDialog } from './edit-mentor-dialog';

interface MentorsTableProps {
  eventSlug: string;
  mentors: Mentor[];
}

export function MentorsTable({ eventSlug, mentors }: MentorsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editMentor, setEditMentor] = useState<Mentor | null>(null);

  const handleDelete = () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteMentorAction(deleteId, eventSlug);
      if (result.success) {
        toast({ type: 'success', description: 'Mentor deleted successfully' });
      } else {
        toast({
          type: 'error',
          description: result.error || 'Failed to delete mentor',
        });
      }
      setDeleteId(null);
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getGithubUsername = (url: string) => {
    return url
      .replace(/^https?:\/\/(www\.)?github\.com\//, '')
      .replace(/\/$/, '');
  };

  const formatAvailability = (availability: Mentor['availability']) => {
    if (!availability || availability.length === 0) {
      return 'No schedule set';
    }

    const dayOrder = { friday: 0, saturday: 1, sunday: 2 };
    const dayNames = { friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

    const sorted = [...availability].sort(
      (a, b) => dayOrder[a.day] - dayOrder[b.day],
    );

    return sorted.map((slot) => (
      <div key={`${slot.day}-${slot.startTime}`} className="text-sm">
        <span className="font-medium">{dayNames[slot.day]}</span>:{' '}
        {slot.startTime} - {slot.endTime}
        {slot.tentative && (
          <Badge variant="outline" className="ml-2">
            TBC
          </Badge>
        )}
      </div>
    ));
  };

  if (mentors.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No mentors found. Create one to get started.</p>
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
              <TableHead>GitHub</TableHead>
              <TableHead>LinkedIn</TableHead>
              <TableHead>Company / Title</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mentors.map((mentor) => (
              <TableRow key={mentor.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={mentor.pictureUrl || undefined}
                        alt={mentor.fullName}
                      />
                      <AvatarFallback>
                        {getInitials(mentor.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{mentor.fullName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={mentor.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    {getGithubUsername(mentor.github)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell>
                  {mentor.linkedin ? (
                    <a
                      href={mentor.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {mentor.companyTitle || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {mentor.availability && mentor.availability.length > 0 ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Calendar className="mr-2 h-4 w-4" />
                          {mentor.availability.length} slot
                          {mentor.availability.length !== 1 ? 's' : ''}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Schedule</h4>
                          {formatAvailability(mentor.availability)}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      No schedule
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMentor(mentor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(mentor.id)}
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
            <AlertDialogTitle>Delete Mentor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mentor? This action cannot be
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

      <EditMentorDialog
        eventSlug={eventSlug}
        mentor={editMentor}
        open={!!editMentor}
        onOpenChange={(open) => !open && setEditMentor(null)}
      />
    </>
  );
}
