import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { projects, teams } from '@/src/lib/db/schema';
import { uploadFile } from '@/src/lib/storage';
import { getProjectLogoStorageKey } from '@/src/lib/storage/keys';
import { getFileBase64, getFileContent } from '@/src/lib/utils/github';
import { getDefaultEvent } from '@/src/queries/events';
import { upsertProject } from '@/src/queries/projects';

const CONCURRENCY_LIMIT = 20;
const REPO_OWNER = 'platanus-hack';
const DEFAULT_BRANCH = 'main';

const _VIDEO_TIMINGS: Record<string, { start: number; end: number }> = {
  'team-13': { start: 0, end: 279 },
  'team-15': { start: 279, end: 662 },
  'team-33': { start: 662, end: 1018 },
  'team-38': { start: 1018, end: 1387 },
  'team-31': { start: 1387, end: 1604 },
  'team-24': { start: 1604, end: 1851 },
  'team-12': { start: 1851, end: 2157 },
  'team-2': { start: 2157, end: 2435 },
  'team-21': { start: 2435, end: 2777 },
  'team-25': { start: 2777, end: 3134 },
  'team-39': { start: 3134, end: 3566 },
  'team-6': { start: 3566, end: 3923 },
  'team-22': { start: 3923, end: 4239 },
  'team-28': { start: 4239, end: 4551 },
  'team-32': { start: 4551, end: 4860 },
  'team-34': { start: 4860, end: 5176 },
  'team-9': { start: 5176, end: 5560 },
  'team-1': { start: 5560, end: 5811 },
  'team-10': { start: 5811, end: 6131 },
  'solo-15': { start: 6131, end: 6419 },
  'team-18': { start: 6419, end: 6726 },
  'team-23': { start: 6726, end: 7054 },
  'solo-3': { start: 7054, end: 7311 },
  'team-27': { start: 7311, end: 7535 },
  'team-3': { start: 7535, end: 7818 },
  'solo-4': { start: 7818, end: 8075 },
  'solo-6': { start: 8075, end: 8393 },
  'team-40': { start: 8393, end: 8713 },
  'team-11': { start: 8713, end: 9047 },
  'team-20': { start: 9047, end: 9345 },
  'team-37': { start: 9345, end: 9673 },
  'team-41': { start: 9673, end: 9938 },
  'solo-7': { start: 9938, end: 10162 },
  'team-43': { start: 10162, end: 10572 },
  'team-7': { start: 10572, end: 10867 },
  'team-8': { start: 10867, end: 11165 },
  'team-16': { start: 11165, end: 11682 },
  'solo-10': { start: 11682, end: 12066 },
  'team-17': { start: 12066, end: 12438 },
  'team-19': { start: 12438, end: 12835 },
  'team-29': { start: 12835, end: 13140 },
  'team-30': { start: 13140, end: 13577 },
  'team-36': { start: 13577, end: 13999 },
  'team-4': { start: 13999, end: 14362 },
  'team-42': { start: 14362, end: 14615 },
};

interface ProjectConfig {
  'project-name': string;
  'project-description-spanish'?: string;
  'deploy-url': string;
}

async function processTeam(team: { id: string; slug: string }): Promise<void> {
  try {
    const repoName = `platanus-hack-25-${team.slug}`;

    // Check if project already exists - skip if it doesn't
    const existingProject = await db.query.projects.findFirst({
      where: eq(projects.teamId, team.id),
    });

    if (!existingProject) {
      console.log(`[CRON] Skipping ${team.slug} - no existing project found`);
      return;
    }

    // Fetch files in parallel
    const [configContent, descriptionContent, logoBase64] = await Promise.all([
      getFileContent(
        REPO_OWNER,
        repoName,
        'platanus-hack-project.json',
        DEFAULT_BRANCH,
      ),
      getFileContent(
        REPO_OWNER,
        repoName,
        'project-description.md',
        DEFAULT_BRANCH,
      ),
      getFileBase64(REPO_OWNER, repoName, 'project-logo.png', DEFAULT_BRANCH),
    ]);

    // Parse Spanish description from config
    let oneliner: string | null = null;

    if (configContent) {
      try {
        const config: ProjectConfig = JSON.parse(configContent);
        oneliner = config['project-description-spanish']?.trim() || null;
      } catch (error) {
        console.warn(
          `[CRON] Failed to parse project config for ${team.slug}:`,
          error,
        );
      }
    }

    // Process markdown description
    const description = descriptionContent?.trim() || null;

    // Process logo
    let logoUrl: string | null = existingProject.logoUrl;
    let logoHash: string | null = existingProject.logoHash;
    if (logoBase64) {
      try {
        const imageBuffer = Buffer.from(logoBase64, 'base64');

        // Compute SHA256 hash of the logo
        logoHash = crypto
          .createHash('sha256')
          .update(imageBuffer)
          .digest('hex');

        const blob = await uploadFile({
          key: getProjectLogoStorageKey(team.slug),
          body: imageBuffer,
          access: 'public',
          contentType: 'image/png',
        });

        logoUrl = blob.url;
      } catch (error) {
        console.error(`[CRON] Failed to upload logo for ${team.slug}:`, error);
      }
    }

    // Update descriptions and logo - keep existing name and slug
    await upsertProject({
      teamId: team.id,
      name: existingProject.name,
      slug: existingProject.slug,
      oneliner,
      description,
      logoUrl,
      logoHash,
      deployUrl: existingProject.deployUrl,
      repoUrl: existingProject.repoUrl,
      videoUrl: existingProject.videoUrl,
      videoStartAt: existingProject.videoStartAt,
      videoEndAt: existingProject.videoEndAt,
    });

    console.log(
      `[CRON] Updated descriptions and logo for ${team.slug}: "${existingProject.name}"${logoUrl !== existingProject.logoUrl ? ' (logo updated)' : ''}`,
    );
  } catch (error) {
    console.error(`[CRON] Error processing team ${team.slug}:`, error);
    throw error;
  }
}

async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  concurrency: number,
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map((item) =>
      processor(item).catch((error) => {
        console.error('[CRON] Batch processing error:', error);
      }),
    );
    await Promise.allSettled(batchPromises);
  }
}

export async function syncProjects(): Promise<void> {
  console.log('[CRON] Starting projects sync...');

  const event = await getDefaultEvent();
  if (!event) {
    console.log('[CRON] No default event found, skipping sync');
    return;
  }

  try {
    const allTeams = await db
      .select({
        id: teams.id,
        slug: teams.slug,
      })
      .from(teams)
      .where(eq(teams.eventId, event.id));

    console.log(
      `[CRON] Found ${allTeams.length} teams to process with concurrency limit of ${CONCURRENCY_LIMIT}`,
    );

    await processBatch(allTeams, processTeam, CONCURRENCY_LIMIT);

    console.log('[CRON] Projects sync completed');
  } catch (error) {
    console.error('[CRON] Error syncing projects:', error);
    throw error;
  }
}
