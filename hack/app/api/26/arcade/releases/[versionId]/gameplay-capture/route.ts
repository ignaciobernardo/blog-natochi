import { eq } from 'drizzle-orm';
import { after, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { arcadeGameVersions } from '@/src/lib/db/schema';
import { runGameplayPreviewJob } from '@/src/operators/arcade-gameplay-preview';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_ZIP_BYTES = 15 * 1024 * 1024; // 15 MB cap
const UPLOAD_WINDOW_MS = 5 * 60 * 1000; // 5 minutes after version creation

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

export async function POST(request: Request, context: RouteContext) {
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
      slug: arcadeGameVersions.slug,
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
          'Upload window has expired. Gameplay previews must be uploaded within 5 minutes of the release.',
      },
      { status: 410 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (_error) {
    return jsonWithCors(
      { success: false, error: 'Expected multipart/form-data body.' },
      { status: 400 },
    );
  }

  const file = formData.get('frames') as Blob | null;
  if (!file) {
    return jsonWithCors(
      { success: false, error: 'Missing "frames" file in form data.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_ZIP_BYTES) {
    return jsonWithCors(
      {
        success: false,
        error: `Frames archive exceeds the ${MAX_ZIP_BYTES} byte cap.`,
      },
      { status: 413 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const zipBuffer = Buffer.from(arrayBuffer);

  // Flip to processing before the response so racing requests see it.
  await db
    .update(arcadeGameVersions)
    .set({ gameplayPreviewStatus: 'processing' })
    .where(eq(arcadeGameVersions.id, versionId));

  // Encode asynchronously so the client gets an immediate ack.
  after(() =>
    runGameplayPreviewJob({
      versionId: version.id,
      slug: version.slug,
      versionNumber: version.versionNumber,
      zipBuffer,
    }),
  );

  return jsonWithCors({
    success: true,
    status: 'processing',
    versionId: version.id,
  });
}
