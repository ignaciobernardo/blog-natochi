import { getEventBySlug } from '@/src/queries/events';

const ARCADE_EVENT_SLUG = '25';

export async function getArcadeEvent() {
  return getEventBySlug(ARCADE_EVENT_SLUG);
}
