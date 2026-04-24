import { redirect } from 'next/navigation';
import {
  getAdminEventSlugById,
  getDefaultAdminPath,
} from '@/src/lib/admin/events';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { getTeamById } from '@/src/queries/teams';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyTeamDetailPage({ params }: PageProps) {
  const { id } = await params;
  const team = await getTeamById(id);

  if (!team) {
    redirect((await getDefaultAdminPath('teams')) as any);
  }

  const eventSlug = await getAdminEventSlugById(team.eventId);

  if (!eventSlug) {
    redirect((await getDefaultAdminPath('teams')) as any);
  }

  redirect(getAdminEventPath(eventSlug, 'teams', id) as any);
}
