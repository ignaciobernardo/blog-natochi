export function getProjectLogoStorageKey(teamSlug: string): string {
  return `project-logos/${teamSlug}.png`;
}

export function getArcadeCoverStorageKey(slug: string): string {
  return `arcade-covers/${slug}.png`;
}

export function getImageUploadStorageKey(filename: string): string {
  return filename;
}

export function getDocumentUploadStorageKey(
  filename: string,
  prefix?: string,
): string {
  const timestampedFilename = `${Date.now()}-${filename}`;
  return prefix ? `${prefix}/${timestampedFilename}` : timestampedFilename;
}

export function getMediaUploadStorageKey(
  filename: string,
  prefix?: string,
): string {
  const timestampedFilename = `${Date.now()}-${filename}`;
  return prefix
    ? `${prefix}/${timestampedFilename}`
    : `feedback-media/${timestampedFilename}`;
}

// Arcade gameplay previews are namespaced by environment so the dev
// environment does not trample production objects sharing the same bucket.
const ARCADE_PREVIEWS_PREFIX =
  process.env.NODE_ENV === 'production'
    ? 'arcade-previews'
    : 'arcade-previews-dev';

export function getArcadeGameplayFramesStorageKey(
  slug: string,
  versionNumber: number,
): string {
  return `${ARCADE_PREVIEWS_PREFIX}/${slug}/v${versionNumber}/frames.zip`;
}

export function getArcadeGameplayPreviewStorageKey(
  slug: string,
  versionNumber: number,
): string {
  return `${ARCADE_PREVIEWS_PREFIX}/${slug}/v${versionNumber}.webm`;
}

export function getArcadeGameplayPosterStorageKey(
  slug: string,
  versionNumber: number,
): string {
  return `${ARCADE_PREVIEWS_PREFIX}/${slug}/v${versionNumber}.webp`;
}
