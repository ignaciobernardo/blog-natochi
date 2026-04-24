'use client';

import { ExternalLink, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import type { TeamWithMembers } from '@/src/queries/teams';

interface TeamsTableProps {
  eventSlug: string;
  teams: TeamWithMembers[];
}

export function TeamsTable({ eventSlug, teams }: TeamsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeams = teams.filter((team) => {
    const query = searchQuery.toLowerCase();
    return (
      team.slug.toLowerCase().includes(query) ||
      team.members.some(
        (member) =>
          member.fullName.toLowerCase().includes(query) ||
          member.github?.toLowerCase().includes(query),
      )
    );
  });

  const getGithubUsername = (url: string | null) => {
    if (!url) return null;
    return url
      .replace(/^https?:\/\/(www\.)?github\.com\//, '')
      .replace(/\/$/, '');
  };

  if (teams.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No teams found. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4">
        <Input
          placeholder="Search by team slug, hacker name, or GitHub username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Table #</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No teams match your search
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{team.slug}</span>
                      {team.formedOnSite && (
                        <Badge variant="secondary" className="w-fit">
                          Formed on-site
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.track ? (
                      <Link
                        href={getAdminEventPath(
                          eventSlug,
                          'tracks',
                          team.track.id,
                        )}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {team.track.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {team.mentor ? (
                      <a
                        href={team.mentor.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        {team.mentor.fullName}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {team.members.length === 0 ? (
                        <span className="text-muted-foreground text-sm">
                          No members
                        </span>
                      ) : (
                        team.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-2"
                          >
                            <span className="text-sm">{member.fullName}</span>
                            {member.github && (
                              <a
                                href={member.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 text-xs hover:text-blue-800"
                              >
                                @{getGithubUsername(member.github)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.tableNumber || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={getAdminEventPath(eventSlug, 'teams', team.id)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Manage
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
