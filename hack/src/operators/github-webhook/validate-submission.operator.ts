import crypto from 'node:crypto';
import { sendTeamDiscordMessage } from './discord-utils';

const DEFAULT_LOGO_SHA256 =
  'f458397e9cdfa4773deef8303177fa03e355a0e4842a7805c8139e782e03a8f3';

interface ProjectConfig {
  'project-name': string;
  'project-description-spanish': string;
  'deploy-url': string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  config?: ProjectConfig;
}

async function validateProjectLogo(
  owner: string,
  repo: string,
  ref: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return { valid: false, error: 'GitHub token not configured' };
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/project-logo.png?ref=${ref}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      return { valid: false, error: 'project-logo.png not found' };
    }

    const data = await response.json();

    if (data.type !== 'file') {
      return { valid: false, error: 'project-logo.png is not a file' };
    }

    const sizeBytes = data.size;
    const maxSizeBytes = 500 * 1024;

    if (sizeBytes > maxSizeBytes) {
      return {
        valid: false,
        error: `project-logo.png is too large (${Math.round(sizeBytes / 1024)}KB, max 500KB)`,
      };
    }

    const cleanContent = data.content.replace(/\n/g, '');
    const imageBuffer = Buffer.from(cleanContent, 'base64');

    const imageSha256 = crypto
      .createHash('sha256')
      .update(imageBuffer)
      .digest('hex');
    if (imageSha256 === DEFAULT_LOGO_SHA256) {
      return {
        valid: false,
        error: 'project-logo.png is the default logo, please use a custom logo',
      };
    }

    const sharp = (await import('sharp')).default;

    try {
      const metadata = await sharp(imageBuffer).metadata();

      if (metadata.format !== 'png') {
        return {
          valid: false,
          error: `project-logo.png must be a PNG file (got ${metadata.format})`,
        };
      }

      if (!metadata.width || !metadata.height) {
        return {
          valid: false,
          error: 'Could not determine image dimensions',
        };
      }

      if (metadata.width !== 1000 || metadata.height !== 1000) {
        return {
          valid: false,
          error: `project-logo.png must be 1000x1000 (got ${metadata.width}x${metadata.height})`,
        };
      }

      return { valid: true };
    } catch (sharpError) {
      console.error('[Validation] Sharp failed to parse image:', {
        error: sharpError instanceof Error ? sharpError.message : sharpError,
        bufferLength: imageBuffer.length,
      });
      return {
        valid: false,
        error: 'project-logo.png could not be parsed as a valid image',
      };
    }
  } catch (error) {
    console.error('Error validating project logo:', error);
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error validating logo',
    };
  }
}

async function validateProjectConfig(
  owner: string,
  repo: string,
  ref: string,
): Promise<ValidationResult> {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return { valid: false, error: 'GitHub token not configured' };
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/platanus-hack-project.json?ref=${ref}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      return { valid: false, error: 'platanus-hack-project.json not found' };
    }

    const data = await response.json();

    if (data.type !== 'file') {
      return {
        valid: false,
        error: 'platanus-hack-project.json is not a file',
      };
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    let config: any;
    try {
      config = JSON.parse(content);
    } catch (parseError) {
      return {
        valid: false,
        error: `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      };
    }

    const errors: string[] = [];

    const projectName = config['project-name'];
    if (!projectName || typeof projectName !== 'string') {
      errors.push('project-name is required');
    } else if (
      projectName.trim() === '<FILL THIS>' ||
      projectName.trim() === ''
    ) {
      errors.push('project-name must be filled');
    }

    const projectDesc = config['project-description-spanish'];
    if (!projectDesc || typeof projectDesc !== 'string') {
      errors.push('project-description-spanish is required');
    } else if (
      projectDesc.trim() === '<FILL THIS>' ||
      projectDesc.trim() === ''
    ) {
      errors.push('project-description-spanish must be filled');
    }

    const deployUrl = config['deploy-url'];
    if (!deployUrl || typeof deployUrl !== 'string') {
      errors.push('deploy-url is required');
    } else if (deployUrl.trim() === '<FILL THIS>' || deployUrl.trim() === '') {
      errors.push('deploy-url must be filled');
    } else {
      try {
        new URL(deployUrl.trim());
      } catch {
        errors.push('deploy-url must be a valid URL');
      }
    }

    if (errors.length > 0) {
      console.log('[Validation] platanus-hack-project.json errors:', {
        config,
        errors,
      });
      return { valid: false, error: errors.join(', ') };
    }

    return {
      valid: true,
      config: {
        'project-name': projectName,
        'project-description-spanish': projectDesc,
        'deploy-url': deployUrl.trim(),
      } as ProjectConfig,
    };
  } catch (error) {
    console.error('Error validating project config:', error);
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error validating config',
    };
  }
}

async function validateProjectDescription(
  owner: string,
  repo: string,
  ref: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return { valid: false, error: 'GitHub token not configured' };
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/project-description.md?ref=${ref}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      return { valid: false, error: 'project-description.md not found' };
    }

    const data = await response.json();

    if (data.type !== 'file') {
      return { valid: false, error: 'project-description.md is not a file' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating project description:', error);
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error validating description',
    };
  }
}

export interface ValidateSubmissionParams {
  teamSlug: string;
  owner: string;
  repoName: string;
  ref: string;
  commitSha: string;
  commitMessage: string;
}

export async function validateSubmission(
  params: ValidateSubmissionParams,
): Promise<void> {
  const { teamSlug, owner, repoName, ref, commitSha, commitMessage } = params;

  console.log(`Processing push for team: ${teamSlug}, commit: ${commitSha}`);

  const [logoValidation, configValidation, descriptionValidation] =
    await Promise.all([
      validateProjectLogo(owner, repoName, ref),
      validateProjectConfig(owner, repoName, ref),
      validateProjectDescription(owner, repoName, ref),
    ]);

  const allValid =
    logoValidation.valid &&
    configValidation.valid &&
    descriptionValidation.valid;

  let discordMessage: string;

  if (allValid) {
    discordMessage = `✅ **Submission Valid!**\n\nCommit \`${commitSha}\` with message "${commitMessage}" is valid for submission.\n\n✅ project-logo.png is valid (1000x1000, under 500KB)\n✅ platanus-hack-project.json is valid\n✅ project-description.md is valid\n- Project: ${configValidation.config?.['project-name']}\n- Deploy: ${configValidation.config?.['deploy-url']}`;
  } else {
    const errors: string[] = [];
    if (!logoValidation.valid) {
      errors.push(`❌ project-logo.png: ${logoValidation.error}`);
    }
    if (!configValidation.valid) {
      errors.push(`❌ platanus-hack-project.json: ${configValidation.error}`);
    }
    if (!descriptionValidation.valid) {
      errors.push(`❌ project-description.md: ${descriptionValidation.error}`);
    }

    discordMessage = `❌ **Submission Invalid**\n\nCommit \`${commitSha}\` with message "${commitMessage}" has errors:\n\n${errors.join('\n')}`;
  }

  await sendTeamDiscordMessage(teamSlug, discordMessage);
}
