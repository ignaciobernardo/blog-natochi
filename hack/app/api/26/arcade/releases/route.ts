import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import {
  getArcadeReleaseAdminPath,
  getArcadeReleaseDetailPath,
  ingestArcadeRelease,
} from '@/src/operators/arcade-release-ingestion';
import { arcadeReleaseNotifier } from '@/src/operators/slack/arcade-release-notifier';

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Request body must be valid JSON',
      },
      { status: 400 },
    );
  }

  const result = await ingestArcadeRelease(payload);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        stage: result.stage,
        diagnosticId: result.diagnosticId,
        details: result.details ?? null,
      },
      { status: result.status },
    );
  }

  revalidatePath('/26/arcade');
  revalidatePath(`/26/arcade/${result.version.slug}`);

  const [adminPath, adminDetailPath] = await Promise.all([
    getArcadeReleaseAdminPath(result.challenge),
    getArcadeReleaseDetailPath(result.challenge, result.game.id),
  ]);

  if (adminPath) {
    revalidatePath(adminPath);
  }

  if (adminDetailPath) {
    revalidatePath(adminDetailPath);
  }

  if (result.created) {
    await arcadeReleaseNotifier.notifyNewVersion({
      githubUsername: result.game.githubUsername,
      title: result.version.title,
      versionNumber: result.version.versionNumber,
      versionSlug: result.version.slug,
    });
  }

  return NextResponse.json({
    success: true,
    created: result.created,
    diagnosticId: result.diagnosticId,
    eventSlug: result.eventSlug,
    gameId: result.game.id,
    versionId: result.version.id,
    slug: result.version.slug,
    versionNumber: result.version.versionNumber,
  });
}
