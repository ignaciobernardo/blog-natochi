'use client';

import { formatDistanceToNow } from 'date-fns';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
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
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type { PersonForEntrance } from '@/src/queries/entrances';
import { markEntranceAction } from '../_actions/mark-entrance.action';

interface EntranceTableProps {
  people: PersonForEntrance[];
  eventId: string;
}

export function EntranceTable({ people, eventId }: EntranceTableProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPerson, setSelectedPerson] =
    useState<PersonForEntrance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleMarkEntrance = (person: PersonForEntrance) => {
    setSelectedPerson(person);
    setDialogOpen(true);
  };

  const confirmEntrance = () => {
    if (!selectedPerson) return;

    startTransition(async () => {
      const result = await markEntranceAction({
        personId: selectedPerson.id,
        personType: selectedPerson.personType,
        eventId,
      });

      if (result.success) {
        toast({
          type: 'success',
          description: result.message || 'Entrance registered',
        });
      } else {
        toast({
          type: 'error',
          description: result.globalError || 'Failed to register entrance',
        });
      }

      setDialogOpen(false);
      setSelectedPerson(null);
    });
  };

  const getGithubUsername = (github: string) => {
    return github
      .replace(/^https?:\/\/(www\.)?github\.com\//, '')
      .replace(/\/$/, '');
  };

  if (people.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Search by name or email to register entrances.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Type</TableHead>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>GitHub</TableHead>
              <TableHead>Shoe Size</TableHead>
              <TableHead>Shirt Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <TableRow key={`${person.personType}-${person.id}`}>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      person.personType === 'hacker'
                        ? 'border-blue-300 bg-blue-100 text-blue-800'
                        : 'border-purple-300 bg-purple-100 text-purple-800'
                    }
                  >
                    {person.personType === 'hacker' ? 'Hacker' : 'Mentor'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{person.fullName}</span>
                    {person.email && (
                      <span className="text-muted-foreground text-sm">
                        {person.email}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {person.github ? (
                    <a
                      href={
                        person.github.startsWith('http')
                          ? person.github
                          : `https://github.com/${person.github}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      {getGithubUsername(person.github)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {person.shoeSize ? (
                    <Badge variant="outline">{person.shoeSize}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {person.shirtSize ? (
                    <Badge variant="outline">{person.shirtSize}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {person.entranceId ? (
                    <Badge className="border-green-300 bg-green-100 text-green-800">
                      <Check className="mr-1 h-3 w-3" />
                      Entered
                      {person.enteredAt && (
                        <span className="ml-1 text-xs opacity-75">
                          {formatDistanceToNow(new Date(person.enteredAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not entered
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {person.entranceId ? (
                    <Button variant="outline" size="sm" disabled>
                      <Check className="mr-1 h-4 w-4" />
                      Entered
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleMarkEntrance(person)}
                      disabled={isPending}
                    >
                      {isPending && selectedPerson?.id === person.id ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : null}
                      Mark Entrance
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Entrance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark{' '}
              <span className="font-semibold">{selectedPerson?.fullName}</span>{' '}
              as entered? This will send a Discord notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEntrance} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm Entrance'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
