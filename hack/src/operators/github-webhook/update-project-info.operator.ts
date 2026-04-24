import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { projects } from '@/src/lib/db/schema';
import { uploadFile } from '@/src/lib/storage';
import { getProjectLogoStorageKey } from '@/src/lib/storage/keys';
import { getFileBase64, getFileContent } from '@/src/lib/utils/github';
import { sendTeamDiscordMessage } from './discord-utils';

interface ProjectConfig {
  'project-name': string;
  'project-description-spanish'?: string;
  'deploy-url': string;
}

export interface UpdateProjectInfoParams {
  teamSlug: string;
  teamId: string;
  owner: string;
  repoName: string;
  ref: string;
  commitSha: string;
  commitMessage: string;
}

export async function updateProjectInfo(
  params: UpdateProjectInfoParams,
): Promise<void> {
  const { teamSlug, teamId, owner, repoName, ref, commitSha, commitMessage } =
    params;

  console.log(
    `[UpdateProjectInfo] Processing update for team: ${teamSlug}, commit: ${commitSha}`,
  );

  try {
    const [configContent, descriptionContent, logoBase64] = await Promise.all([
      getFileContent(owner, repoName, 'platanus-hack-project.json', ref),
      getFileContent(owner, repoName, 'project-description.md', ref),
      getFileBase64(owner, repoName, 'project-logo.png', ref),
    ]);

    let oneliner: string | null = null;

    if (configContent) {
      try {
        const config: ProjectConfig = JSON.parse(configContent);
        oneliner = config['project-description-spanish']?.trim() || null;
      } catch (error) {
        console.warn(
          `[UpdateProjectInfo] Failed to parse project config for ${teamSlug}:`,
          error,
        );
      }
    }

    const description = descriptionContent?.trim() || null;
    if (description === '<FILL THIS>' || description === '') {
      console.log(
        `[UpdateProjectInfo] Warning: ${teamSlug} has empty description`,
      );
    }

    let logoUrl: string | null = null;
    let logoHash: string | null = null;
    if (logoBase64) {
      try {
        const imageBuffer = Buffer.from(logoBase64, 'base64');

        logoHash = crypto
          .createHash('sha256')
          .update(imageBuffer)
          .digest('hex');

        const blob = await uploadFile({
          key: getProjectLogoStorageKey(teamSlug),
          body: imageBuffer,
          access: 'public',
          contentType: 'image/png',
        });

        logoUrl = blob.url;
      } catch (error) {
        console.error(
          `[UpdateProjectInfo] Failed to upload logo for ${teamSlug}:`,
          error,
        );
      }
    }

    const existingProject = await db.query.projects.findFirst({
      where: eq(projects.teamId, teamId),
    });

    if (!existingProject) {
      console.log(
        `[UpdateProjectInfo] No project found for team ${teamSlug}, skipping update`,
      );
      return;
    }

    const updateData: any = {};
    let hasChanges = false;

    if (oneliner && oneliner !== existingProject.oneliner) {
      updateData.oneliner = oneliner;
      hasChanges = true;
    }

    if (description && description !== existingProject.description) {
      updateData.description = description;
      hasChanges = true;
    }

    if (logoUrl && logoHash && logoHash !== existingProject.logoHash) {
      updateData.logoUrl = logoUrl;
      updateData.logoHash = logoHash;
      hasChanges = true;
    }

    if (!hasChanges) {
      console.log(
        `[UpdateProjectInfo] No changes detected for team ${teamSlug}`,
      );
      return;
    }

    await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.teamId, teamId));

    const updatedFields: string[] = [];
    if (updateData.oneliner) updatedFields.push('oneliner');
    if (updateData.description) updatedFields.push('description');
    if (updateData.logoUrl) updatedFields.push('logo');

    console.log(
      `[UpdateProjectInfo] Updated ${updatedFields.join(', ')} for ${teamSlug}`,
    );

    const discordMessage = `🔄 **Project Updated!**\n\nCommit \`${commitSha}\` with message "${commitMessage}" has updated your project info:\n\n${updatedFields.map((f) => `✅ ${f} updated`).join('\n')}`;

    await sendTeamDiscordMessage(teamSlug, discordMessage);
  } catch (error) {
    console.error(
      `[UpdateProjectInfo] Error processing team ${teamSlug}:`,
      error,
    );
    throw error;
  }
}
