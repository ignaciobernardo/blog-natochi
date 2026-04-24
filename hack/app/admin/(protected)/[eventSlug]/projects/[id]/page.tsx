import { ArrowLeft, CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { YouTubePlayer } from '@/src/components/youtube-player';
import { getAdminEventBySlug } from '@/src/lib/admin/events';
import { generateAdminMetadata } from '@/src/lib/admin/metadata';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { onlyAdmin } from '@/src/lib/auth/server';
import { extractYouTubeId } from '@/src/lib/utils/youtube';
import { getProjectById } from '@/src/queries/projects';
import { getTeamById } from '@/src/queries/teams';
import { EditProjectForm } from './_components/edit-project-form';

interface PageProps {
  params: Promise<{ eventSlug: string; id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    return generateAdminMetadata('Project Not Found');
  }

  return generateAdminMetadata(`Project - ${project.name}`);
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { eventSlug, id } = await params;
  await onlyAdmin();
  const event = await getAdminEventBySlug(eventSlug);

  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const team = await getTeamById(project.teamId);

  if (!team || team.eventId !== event.id) {
    notFound();
  }

  const videoId = project.videoUrl ? extractYouTubeId(project.videoUrl) : null;

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={getAdminEventPath(eventSlug, 'projects') as any}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.slug} • Team:{' '}
            {team ? (
              <Link
                href={getAdminEventPath(eventSlug, 'teams', team.id)}
                className="text-blue-600 hover:text-blue-800"
              >
                {team.slug}
              </Link>
            ) : (
              'Unknown'
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <EditProjectForm
            projectId={project.id}
            currentOnelinerShort={project.onelinerShort}
          />

          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Basic details about the project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 font-medium text-sm">Name</div>
                <p className="text-sm">{project.name}</p>
              </div>

              {project.onelinerShort && (
                <div>
                  <div className="mb-1 font-medium text-sm">Short Oneliner</div>
                  <p className="text-sm">{project.onelinerShort}</p>
                </div>
              )}

              {project.description && (
                <div>
                  <div className="mb-1 font-medium text-sm">Description</div>
                  <p className="text-sm">{project.description}</p>
                </div>
              )}

              <div>
                <div className="mb-1 font-medium text-sm">Slug</div>
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {project.slug}
                </code>
              </div>

              {team && (
                <>
                  <div>
                    <div className="mb-1 font-medium text-sm">Team</div>
                    <Link
                      href={getAdminEventPath(eventSlug, 'teams', team.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {team.slug}
                    </Link>
                  </div>

                  {team.track && (
                    <div>
                      <div className="mb-1 font-medium text-sm">Track</div>
                      <Badge variant="secondary">{team.track.name}</Badge>
                    </div>
                  )}

                  <div>
                    <div className="mb-1 font-medium text-sm">
                      Team Members ({team.members.length})
                    </div>
                    <div className="space-y-2">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded border p-2"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {member.fullName}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {member.email}
                            </div>
                          </div>
                          {member.github && (
                            <a
                              href={member.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {project.logoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Project Logo</CardTitle>
                <CardDescription>Project branding image</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                  <Image
                    src={project.logoUrl}
                    alt={`${project.name} logo`}
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Links & Resources</CardTitle>
              <CardDescription>External project resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {project.repoUrl ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Repository</p>
                    {project.repoUrl ? (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 text-sm hover:text-blue-800"
                      >
                        {project.repoUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No repository linked
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {project.deployUrl ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Deployment</p>
                    {project.deployUrl ? (
                      <a
                        href={project.deployUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 text-sm hover:text-blue-800"
                      >
                        {project.deployUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No deployment linked
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {project.slidesUrl ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Slides</p>
                    {project.slidesUrl ? (
                      <a
                        href={project.slidesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 text-sm hover:text-blue-800"
                      >
                        View slides
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No slides uploaded
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
              <CardDescription>Creation and update dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 font-medium text-sm">Created At</div>
                <p className="text-sm">
                  {new Date(project.createdAt).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </p>
              </div>

              <div>
                <div className="mb-1 font-medium text-sm">Updated At</div>
                <p className="text-sm">
                  {new Date(project.updatedAt).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Presentation Status</CardTitle>
              <CardDescription>
                Submission status for presentation materials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {project.sourceHasSlides ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <p className="font-medium">Slides Source</p>
                </div>
                <Badge
                  variant={project.sourceHasSlides ? 'default' : 'outline'}
                >
                  {project.sourceHasSlides ? 'Submitted' : 'Pending'}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {project.sourceHasDemo ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <p className="font-medium">Demo Source</p>
                </div>
                <Badge variant={project.sourceHasDemo ? 'default' : 'outline'}>
                  {project.sourceHasDemo ? 'Submitted' : 'Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {project.videoUrl && videoId && (
            <Card>
              <CardHeader>
                <CardTitle>Project Video</CardTitle>
                <CardDescription>
                  Presentation video{' '}
                  {project.videoStartAt !== null &&
                    project.videoEndAt !== null && (
                      <span>
                        ({project.videoStartAt}s - {project.videoEndAt}s)
                      </span>
                    )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <YouTubePlayer
                  videoId={videoId}
                  startAt={project.videoStartAt}
                  endAt={project.videoEndAt}
                />

                {project.videoStartAt !== null &&
                  project.videoEndAt !== null && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Start Time</div>
                        <div className="text-muted-foreground">
                          {project.videoStartAt}s
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">End Time</div>
                        <div className="text-muted-foreground">
                          {project.videoEndAt}s
                        </div>
                      </div>
                    </div>
                  )}

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a
                      href={project.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open on YouTube
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Public Page</CardTitle>
              <CardDescription>
                View how this project appears publicly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link
                  href={`/25/vote/${project.slug}` as any}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Public Page
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
