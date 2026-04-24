import { resolveUrl } from '@/src/lib/utils/url';
import { slackService } from '@/src/services/slack';

type NotifyNewArcadeReleaseInput = {
  githubUsername: string;
  title: string;
  versionNumber: number;
  versionSlug: string;
};

export class ArcadeReleaseNotifier {
  async notifyNewVersion(input: NotifyNewArcadeReleaseInput): Promise<void> {
    const gameUrl = resolveUrl(
      `/26/arcade/${input.versionSlug}?version=${encodeURIComponent(`v${input.versionNumber}`)}`,
    );
    const message = `👾 Nueva versión V${input.versionNumber} del juego <${gameUrl}|${input.title}> de ${input.githubUsername}`;

    await slackService.sendMessage(message, { unfurlLinks: false });
  }
}

export const arcadeReleaseNotifier = new ArcadeReleaseNotifier();
