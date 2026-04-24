import { ArrowLeft, CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
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
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { getAllMentors } from '@/src/queries/mentors';
import { getPresentationUploadByTeamId } from '@/src/queries/presentation-uploads';
import { getTeamById } from '@/src/queries/teams';
import { AddHackerDialog } from '../_components/add-hacker-dialog';
import { AssignMentorDialog } from '../_components/assign-mentor-dialog';
import { RemoveHackerButton } from '../_components/remove-hacker-button';

interface PageProps {
  params: Promise<{ eventSlug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const team = await getTeamById(id);

  if (!team) {
    return generateAdminMetadata('Team Not Found');
  }

  return generateAdminMetadata(`Team: ${team.slug}`);
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { eventSlug, id } = await params;
  const event = await getAdminEventBySlug(eventSlug);
  const team = await getTeamById(id);

  if (!team || team.eventId !== event.id) {
    notFound();
  }

  const mentors = await getAllMentors(event.id);
  const presentationUpload = await getPresentationUploadByTeamId(id);

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
          <Link href={getAdminEventPath(eventSlug, 'teams')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">{team.slug}</h1>
          <div className="mt-2 flex items-center gap-2">
            {team.track && <Badge>{team.track.name}</Badge>}
            {team.mentor && (
              <Badge variant="secondary">Mentor: {team.mentor.fullName}</Badge>
            )}
            {team.formedOnSite && (
              <Badge variant="secondary">Formed on-site</Badge>
            )}
            {team.tableNumber && (
              <Badge variant="outline">Table {team.tableNumber}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AssignMentorDialog
            teamId={team.id}
            currentMentorId={team.mentorId}
            mentors={mentors}
          />
          <AddHackerDialog teamId={team.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({team.members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {team.members.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No members in this team yet.</p>
              <p className="mt-2 text-sm">
                Click &quot;Add Hacker&quot; to add members.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{member.fullName}</span>
                      {member.github && (
                        <a
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800"
                        >
                          @{getGithubUsername(member.github)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {member.email}
                    </span>
                  </div>
                  <RemoveHackerButton
                    hackerProfileId={member.id}
                    hackerName={member.fullName}
                    teamId={team.id}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presentation Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                {presentationUpload?.slidesUploadedAt ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Slides (PDF)</p>
                  {presentationUpload?.slidesUploadedAt ? (
                    <p className="text-muted-foreground text-sm">
                      Uploaded on{' '}
                      {new Date(
                        presentationUpload.slidesUploadedAt,
                      ).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Not uploaded yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                {presentationUpload?.demoUploadedAt ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Demo Video</p>
                  {presentationUpload?.demoUploadedAt ? (
                    <p className="text-muted-foreground text-sm">
                      Uploaded on{' '}
                      {new Date(
                        presentationUpload.demoUploadedAt,
                      ).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Not uploaded yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
