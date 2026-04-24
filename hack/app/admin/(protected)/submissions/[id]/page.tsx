import { redirect } from 'next/navigation';
import {
  getAdminEventSlugById,
  getDefaultAdminPath,
} from '@/src/lib/admin/events';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { getSubmissionById } from '@/src/queries/submissions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacySubmissionDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const submission = await getSubmissionById(id);

  if (!submission) {
    redirect((await getDefaultAdminPath('review')) as any);
  }

  const eventSlug = await getAdminEventSlugById(submission.eventId);

  if (!eventSlug) {
    redirect((await getDefaultAdminPath('review')) as any);
  }

  redirect(getAdminEventPath(eventSlug, 'submissions', id) as any);
}
