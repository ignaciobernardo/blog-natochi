import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { arcadeGameVersions } from '@/src/lib/db/schema';

/**
 * Converts a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/[^\w-]+/g, '') // Remove non-word chars (except hyphens)
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Remove leading hyphens
    .replace(/-+$/, ''); // Remove trailing hyphens
}

/**
 * Generates a unique slug for an arcade game version
 * If the base slug already exists, appends a short hex disambiguator
 */
export async function generateUniqueSlug(
  title: string,
  checkAvailability?: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = slugify(title);

  if (!baseSlug) {
    return generateRandomSlug();
  }

  const isAvailable = checkAvailability || defaultCheckAvailability;

  if (await isAvailable(baseSlug)) {
    return baseSlug;
  }

  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const disambiguator = generateHexDisambiguator();
    const candidateSlug = `${baseSlug}-${disambiguator}`;

    if (await isAvailable(candidateSlug)) {
      return candidateSlug;
    }
  }

  return generateRandomSlug();
}

async function defaultCheckAvailability(slug: string): Promise<boolean> {
  const existing = await db.query.arcadeGameVersions.findFirst({
    where: eq(arcadeGameVersions.slug, slug),
  });
  return !existing;
}

/**
 * Generates a short hex disambiguator (4 characters)
 */
function generateHexDisambiguator(): string {
  return Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');
}

/**
 * Generates a completely random slug as fallback
 */
function generateRandomSlug(): string {
  return `game-${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
}
