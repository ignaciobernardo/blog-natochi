import { notFound, redirect } from 'next/navigation';
import { getDefaultEvent, getEventBySlug } from '@/src/queries/events';

interface PicsPageProps {
  searchParams: Promise<{ eventSlug?: string }>;
}

export default async function PicsPage({ searchParams }: PicsPageProps) {
  const { eventSlug } = await searchParams;

  if (eventSlug) {
    const event = await getEventBySlug(eventSlug);

    if (!event) {
      notFound();
    }

    if (!event.photosAlbumUrl) {
      throw new Error(
        `Photos album URL is not configured for event "${eventSlug}"`,
      );
    }

    redirect(event.photosAlbumUrl as never);
  }

  const defaultEvent = await getDefaultEvent();
  if (!defaultEvent || !defaultEvent.photosAlbumUrl) {
    notFound();
  }

  redirect(defaultEvent.photosAlbumUrl as never);
}
