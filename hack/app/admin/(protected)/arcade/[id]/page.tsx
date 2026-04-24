import { redirect } from 'next/navigation';
import {
  getAdminEventSlugById,
  getDefaultAdminPath,
} from '@/src/lib/admin/events';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import {
  getArcadeChallengeById,
  getArcadeGameById,
} from '@/src/queries/arcade-games';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyArcadeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const game = await getArcadeGameById(id);

  if (!game) {
    redirect((await getDefaultAdminPath('arcade')) as any);
  }

  const challenge = await getArcadeChallengeById(game.challengeId);
  if (!challenge) {
    redirect((await getDefaultAdminPath('arcade')) as any);
  }

  const eventSlug = await getAdminEventSlugById(challenge.eventId);

  if (!eventSlug) {
    redirect((await getDefaultAdminPath('arcade')) as any);
  }

  redirect(getAdminEventPath(eventSlug, 'arcade', id) as any);
}
