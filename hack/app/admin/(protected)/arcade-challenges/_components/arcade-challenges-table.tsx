'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { getAdminEventBasePath } from '@/src/lib/admin/routes';
import type { ArcadeChallengeWithEvent } from '@/src/queries/arcade-games';
import { DeleteArcadeChallengeDialog } from './delete-arcade-challenge-dialog';
import { UpdateArcadeChallengeDialog } from './update-arcade-challenge-dialog';

interface ArcadeChallengesTableProps {
  challenges: ArcadeChallengeWithEvent[];
  events: Array<{ id: string; name: string; slug: string }>;
}

function formatDateTime(date: Date) {
  return (
    <div className="space-y-1">
      <div className="text-sm">
        {date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
      <div className="text-muted-foreground text-xs">
        {formatDistanceToNow(date, { addSuffix: true })}
      </div>
    </div>
  );
}

export function ArcadeChallengesTable({
  challenges,
  events,
}: ArcadeChallengesTableProps) {
  if (challenges.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No arcade challenges found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">Name</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Submission Deadline</TableHead>
            <TableHead>Voting Deadline</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {challenges.map((challenge) => (
            <TableRow key={challenge.id}>
              <TableCell>
                <div className="font-medium text-sm">{challenge.name}</div>
                <div className="text-muted-foreground text-xs">
                  {challenge.slug}
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={getAdminEventBasePath(challenge.event.slug)}
                  className="text-primary text-sm underline"
                >
                  {challenge.event.name}
                </Link>
              </TableCell>
              <TableCell>
                {formatDateTime(challenge.submissionDeadline)}
              </TableCell>
              <TableCell>{formatDateTime(challenge.votingDeadline)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <UpdateArcadeChallengeDialog
                    challenge={challenge}
                    events={events}
                  />
                  <DeleteArcadeChallengeDialog
                    challengeId={challenge.id}
                    challengeName={challenge.name}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
