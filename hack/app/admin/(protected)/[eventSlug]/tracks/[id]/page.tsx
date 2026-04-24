import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { getTeamsByTrackId, getTrackById } from '@/src/queries/tracks';

interface PageProps {
  params: Promise<{ eventSlug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { eventSlug, id } = await params;
  const event = await getAdminEventBySlug(eventSlug);
  const track = await getTrackById(id, event.id);

  if (!track) {
    return generateAdminMetadata('Track Not Found');
  }

  return generateAdminMetadata(`Track: ${track.name}`);
}

export default async function TrackDetailPage({ params }: PageProps) {
  const { eventSlug, id } = await params;
  const event = await getAdminEventBySlug(eventSlug);
  const track = await getTrackById(id, event.id);

  if (!track) {
    notFound();
  }

  const teams = await getTeamsByTrackId(id, event.id);

  const getGithubUsername = (url: string | null) => {
    if (!url) return null;
    return url
      .replace(/^https?:\/\/(www\.)?github\.com\//, '')
      .replace(/\/$/, '');
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={getAdminEventPath(eventSlug, 'tracks')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tracks
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">{track.name}</h1>
          {track.description && (
            <p className="mt-2 text-muted-foreground">{track.description}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teams ({teams.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {teams.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No teams have selected this track yet.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Table #</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
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
                                <span className="text-sm">
                                  {member.fullName}
                                </span>
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
                            href={getAdminEventPath(
                              eventSlug,
                              'teams',
                              team.id,
                            )}
                          >
                            View Team
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
