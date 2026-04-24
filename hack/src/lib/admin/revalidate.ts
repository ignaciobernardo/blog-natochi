import { revalidatePath } from 'next/cache';
import { getSubmissionById } from '@/src/queries/submissions';
import { getAdminEventSlugById } from './events';
import { getAdminEventPath } from './routes';

export async function revalidateAdminEventPathByEventId(
  eventId: string,
  ...segments: Array<string | number>
) {
  const eventSlug = await getAdminEventSlugById(eventId);

  if (!eventSlug) {
    return;
  }

  revalidatePath(getAdminEventPath(eventSlug, ...segments));
}

export function revalidateAdminEventPath(
  eventSlug: string,
  ...segments: Array<string | number>
) {
  revalidatePath(getAdminEventPath(eventSlug, ...segments));
}

export async function revalidateAdminSubmissionPaths(submissionId: string) {
  const submission = await getSubmissionById(submissionId);

  if (!submission) {
    return;
  }

  await revalidateAdminEventPathByEventId(
    submission.eventId,
    'submissions',
    submissionId,
  );
  await revalidateAdminEventPathByEventId(submission.eventId, 'review');
}
