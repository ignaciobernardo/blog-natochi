'use client';

import { ExternalLink, Github, Linkedin } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type { ExternalPerson } from '@/src/lib/db/schema';
import { DeleteExternalPersonDialog } from './delete-external-person-dialog';
import { EditExternalPersonDialog } from './edit-external-person-dialog';

interface ExternalPeopleTableProps {
  eventSlug: string;
  people: ExternalPerson[];
}

export function ExternalPeopleTable({
  eventSlug,
  people,
}: ExternalPeopleTableProps) {
  if (people.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No external people found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Slug</TableHead>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead className="w-[120px]">Category</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[100px]">Links</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person) => (
            <TableRow key={person.id}>
              <TableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {person.slug}
                </code>
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm">{person.fullName}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{person.category}</Badge>
              </TableCell>
              <TableCell>
                <div className="text-muted-foreground text-sm">
                  {person.role || '-'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {person.githubUrl && (
                    <a
                      href={person.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {person.linkedinUrl && (
                    <a
                      href={person.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {person.redirectUrl && (
                    <a
                      href={person.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      title="Redirect URL"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <EditExternalPersonDialog
                    eventId={person.eventId}
                    eventSlug={eventSlug}
                    person={person}
                  />
                  <DeleteExternalPersonDialog
                    eventId={person.eventId}
                    eventSlug={eventSlug}
                    personId={person.id}
                    personName={person.fullName}
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
