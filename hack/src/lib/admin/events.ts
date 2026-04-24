import { notFound } from 'next/navigation';
import { cache } from 'react';
import {
  getDefaultEvent,
  getEventById,
  getEventBySlug,
} from '@/src/queries/events';
import { getSubmissionById } from '@/src/queries/submissions';
import { getAdminEventPath, getAdminGeneralPath } from './routes';

export const getAdminEventBySlug = cache(async (eventSlug: string) => {
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  return event;
});

export const getDefaultAdminEvent = cache(async () => getDefaultEvent());

export const getDefaultAdminPath = cache(
  async (segment: string = 'dashboard') => {
    const defaultEvent = await getDefaultAdminEvent();

    if (!defaultEvent) {
      return getAdminGeneralPath('events');
    }

    return getAdminEventPath(defaultEvent.slug, segment);
  },
);

export const getAdminEventSlugById = cache(async (eventId: string) => {
  const event = await getEventById(eventId);
  return event?.slug ?? null;
});

export const getAdminSubmissionPathById = cache(
  async (submissionId: string) => {
    const submission = await getSubmissionById(submissionId);

    if (!submission) {
      return `/admin/submissions/${submissionId}`;
    }

    const eventSlug = await getAdminEventSlugById(submission.eventId);

    if (!eventSlug) {
      return `/admin/submissions/${submissionId}`;
    }

    return getAdminEventPath(eventSlug, 'submissions', submissionId);
  },
);
