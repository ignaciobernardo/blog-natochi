export const ARCADE_26_EVENT_SLUG = '26';
export const ARCADE_26_BASE_PATH = '/26/arcade';
export const ARCADE_26_PLAYS_API_PATH = '/api/26/arcade/plays';

export function getArcade26GamePath(
  gameSlug: string,
  versionSlug?: string | null,
): string {
  const search = versionSlug
    ? `?version=${encodeURIComponent(versionSlug)}`
    : '';

  return `${ARCADE_26_BASE_PATH}/${gameSlug}${search}`;
}

export function getArcade26IntroPath(): string {
  return `${ARCADE_26_BASE_PATH}/intro`;
}
