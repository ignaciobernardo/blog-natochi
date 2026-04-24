import { and, desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { arcadeGames, arcadeGameVersions } from '@/src/lib/db/schema';

export const runtime = 'nodejs';

const STALE_PROCESSING_MS = 5 * 60 * 1000;

type PreviewStatus = 'none' | 'processing' | 'ready' | 'failed';

interface PreviewResponse {
  success: true;
  status: PreviewStatus;
  versionId: string | null;
  versionNumber: number | null;
  previewVideoUrl: string | null;
  posterUrl: string | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const githubUsername = searchParams.get('githubUsername')?.trim();
  const repoName = searchParams.get('repoName')?.trim();

  if (!githubUsername || !repoName) {
    return NextResponse.json(
      { success: false, error: 'Missing githubUsername or repoName.' },
      { status: 400 },
    );
  }

  // Find the latest version for this repo regardless of challenge — the
  // arcade-repo client only knows the github identity, not which event slug
  // it was submitted under.
  const [row] = await db
    .select({
      versionId: arcadeGameVersions.id,
      versionNumber: arcadeGameVersions.versionNumber,
      gameplayPreviewStatus: arcadeGameVersions.gameplayPreviewStatus,
      gameplayPreviewUrl: arcadeGameVersions.gameplayPreviewUrl,
      gameplayPosterUrl: arcadeGameVersions.gameplayPosterUrl,
      updatedAt: arcadeGameVersions.updatedAt,
    })
    .from(arcadeGameVersions)
    .innerJoin(arcadeGames, eq(arcadeGameVersions.gameId, arcadeGames.id))
    .where(
      and(
        eq(arcadeGames.githubUsername, githubUsername),
        eq(arcadeGames.repoName, repoName),
      ),
    )
    .orderBy(desc(arcadeGameVersions.versionNumber))
    .limit(1);

  if (!row) {
    const empty: PreviewResponse = {
      success: true,
      status: 'none',
      versionId: null,
      versionNumber: null,
      previewVideoUrl: null,
      posterUrl: null,
    };
    return NextResponse.json(empty);
  }

  let status = row.gameplayPreviewStatus as PreviewStatus;

  // Safety net: if an encode has been stuck in "processing" longer than the
  // upload window, treat it as failed so the user can retry.
  if (
    status === 'processing' &&
    Date.now() - new Date(row.updatedAt).getTime() > STALE_PROCESSING_MS
  ) {
    status = 'failed';
  }

  const response: PreviewResponse = {
    success: true,
    status,
    versionId: row.versionId,
    versionNumber: row.versionNumber,
    previewVideoUrl: status === 'ready' ? row.gameplayPreviewUrl : null,
    posterUrl: status === 'ready' ? row.gameplayPosterUrl : null,
  };

  return NextResponse.json(response);
}
