export const ADMIN_EVENT_ROUTE_SEGMENTS = [
  'dashboard',
  'review',
  'entrance',
  'teams',
  'projects',
  'tracks',
  'mentors',
  'arcade',
  'time-slots',
  'external-people',
] as const;

export const ADMIN_GENERAL_ROUTE_SEGMENTS = [
  'events',
  'arcade-challenges',
  'emails',
  'users',
  'cron',
] as const;

export type AdminEventRouteSegment =
  (typeof ADMIN_EVENT_ROUTE_SEGMENTS)[number];
export type AdminGeneralRouteSegment =
  (typeof ADMIN_GENERAL_ROUTE_SEGMENTS)[number];

export function getAdminHomePath(): any {
  return '/admin';
}

export function getAdminGeneralPath(segment: AdminGeneralRouteSegment): any {
  return `/admin/${segment}`;
}

export function getAdminEventBasePath(eventSlug: string): any {
  return `/admin/${eventSlug}`;
}

export function getAdminEventPath(
  eventSlug: string,
  ...segments: Array<string | number>
): any {
  const sanitized = segments
    .map((segment) => segment.toString().replace(/^\/+|\/+$/g, ''))
    .filter(Boolean);

  if (sanitized.length === 0) {
    return getAdminEventBasePath(eventSlug);
  }

  return `${getAdminEventBasePath(eventSlug)}/${sanitized.join('/')}`;
}
