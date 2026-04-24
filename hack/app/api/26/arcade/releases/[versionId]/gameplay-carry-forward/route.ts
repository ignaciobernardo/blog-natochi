import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { arcadeGameVersions } from '@/src/lib/db/schema';

export const runtime = 'nodejs';

const UPLOAD_WINDOW_MS = 5 * 60 * 1000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
} as const;

function jsonWithCors(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init?.headers ?? {}) },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

interface RouteContext {
  params: Promise<{ versionId: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { versionId } = await context.params;

  if (!versionId) {
    return jsonWithCors(
      { success: false, error: 'Missing versionId' },
      { status: 400 },
    );
  }

  const [version] = await db
    .select({
      id: arcadeGameVersions.id,
      gameId: arcadeGameVersions.gameId,
      versionNumber: arcadeGameVersions.versionNumber,
      createdAt: arcadeGameVersions.createdAt,
      gameplayPreviewStatus: arcadeGameVersions.gameplayPreviewStatus,
    })
    .from(arcadeGameVersions)
    .where(eq(arcadeGameVersions.id, versionId))
    .limit(1);

  if (!version) {
    return jsonWithCors(
      { success: false, error: 'Version not found' },
      { status: 404 },
    );
  }

  if (
    version.gameplayPreviewStatus === 'ready' ||
    version.gameplayPreviewStatus === 'processing'
  ) {
    return jsonWithCors(
      {
        success: false,
        error: 'A gameplay preview already exists for this version.',
        status: version.gameplayPreviewStatus,
      },
      { status: 409 },
    );
  }

  const ageMs = Date.now() - new Date(version.createdAt).getTime();
  if (ageMs > UPLOAD_WINDOW_MS) {
    return jsonWithCors(
      {
        success: false,
        error:
          'Upload window has expired. Gameplay previews must be carried forward within 5 minutes of the release.',
      },
      { status: 410 },
    );
  }

  // Find the most recent previous version of the same game that has a
  // ready preview and reuse its asset URLs.
  const [previous] = await db
    .select({
      gameplayPreviewUrl: arcadeGameVersions.gameplayPreviewUrl,
      gameplayPosterUrl: arcadeGameVersions.gameplayPosterUrl,
      versionNumber: arcadeGameVersions.versionNumber,
    })
    .from(arcadeGameVersions)
    .where(
      and(
        eq(arcadeGameVersions.gameId, version.gameId),
        eq(arcadeGameVersions.gameplayPreviewStatus, 'ready'),
        isNotNull(arcadeGameVersions.gameplayPreviewUrl),
      ),
    )
    .orderBy(desc(arcadeGameVersions.versionNumber))
    .limit(1);

  if (!previous?.gameplayPreviewUrl) {
    return jsonWithCors(
      {
        success: false,
        error: 'No previous gameplay preview is available to carry forward.',
      },
      { status: 404 },
    );
  }

  await db
    .update(arcadeGameVersions)
    .set({
      gameplayPreviewUrl: previous.gameplayPreviewUrl,
      gameplayPosterUrl: previous.gameplayPosterUrl,
      gameplayPreviewStatus: 'ready',
    })
    .where(eq(arcadeGameVersions.id, versionId));

  return jsonWithCors({
    success: true,
    status: 'ready',
    carriedFromVersionNumber: previous.versionNumber,
    previewVideoUrl: previous.gameplayPreviewUrl,
    posterUrl: previous.gameplayPosterUrl,
  });
}
