import { redirect } from 'next/navigation';
import {
  getAdminEventSlugById,
  getDefaultAdminPath,
} from '@/src/lib/admin/events';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { getTrackById } from '@/src/queries/tracks';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyTrackDetailPage({ params }: PageProps) {
  const { id } = await params;
  const track = await getTrackById(id);

  if (track) {
    const eventSlug = await getAdminEventSlugById(track.eventId);

    if (eventSlug) {
      redirect(getAdminEventPath(eventSlug, 'tracks', id) as any);
    }
  }

  const basePath = await getDefaultAdminPath('tracks');

  if (basePath === '/admin/events') {
    redirect(basePath as any);
  }

  redirect(`${basePath}/${id}` as any);
}
