import { redirect } from 'next/navigation';
import {
  getAdminEventSlugById,
  getDefaultAdminPath,
} from '@/src/lib/admin/events';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { getProjectById } from '@/src/queries/projects';
import { getTeamById } from '@/src/queries/teams';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProjectById(id);
  const team = project ? await getTeamById(project.teamId) : null;

  if (!team) {
    redirect((await getDefaultAdminPath('projects')) as any);
  }

  const eventSlug = await getAdminEventSlugById(team.eventId);

  if (!eventSlug) {
    redirect((await getDefaultAdminPath('projects')) as any);
  }

  redirect(getAdminEventPath(eventSlug, 'projects', id) as any);
}
