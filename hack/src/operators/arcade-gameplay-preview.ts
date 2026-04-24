import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { arcadeGameVersions } from '@/src/lib/db/schema';
import { uploadFile } from '@/src/lib/storage';
import {
  getArcadeGameplayPosterStorageKey,
  getArcadeGameplayPreviewStorageKey,
} from '@/src/lib/storage/keys';

// Source capture settings the arcade-repo client uses. Keep in sync there.
const CAPTURE_FPS = 10;
const CAPTURE_DURATION_SECONDS = 10;
// The client targets 100 frames but some can be dropped by browser timing
// races (toBlob resolving after the capture window ends, the final frame
// fighting the modal transition, etc). We only reject an upload if the
// loss exceeds 10% so normal drops don't break the encode.
const MIN_FRAME_COUNT = Math.floor(
  CAPTURE_FPS * CAPTURE_DURATION_SECONDS * 0.9,
);

// Final preview clip settings.
const PREVIEW_LENGTH_SECONDS = 5;
const PREVIEW_LENGTH_FRAMES = CAPTURE_FPS * PREVIEW_LENGTH_SECONDS;
const PREVIEW_VIDEO_BITRATE = '400k';

interface RunGameplayPreviewJobInput {
  versionId: string;
  slug: string;
  versionNumber: number;
  zipBuffer: Buffer;
}

export async function runGameplayPreviewJob(
  input: RunGameplayPreviewJobInput,
): Promise<void> {
  const { versionId, slug, versionNumber, zipBuffer } = input;
  const workDir = join(tmpdir(), `arcade-preview-${versionId}-${randomUUID()}`);

  try {
    await mkdir(workDir, { recursive: true });

    const frameCount = await extractFramesToDir(zipBuffer, workDir);
    if (frameCount < MIN_FRAME_COUNT) {
      throw new Error(
        `Not enough frames to encode preview: received ${frameCount}, expected at least ${MIN_FRAME_COUNT}.`,
      );
    }

    // Score each frame with ffmpeg's scene-change detector, then pick the
    // 3-second window that carries the most visual change across it.
    const scores = await analyzeFrameScores(workDir, frameCount);
    const bestStartFrame = pickBestWindow(scores, PREVIEW_LENGTH_FRAMES);

    const previewPath = join(workDir, 'preview.webm');
    await encodePreviewWebm(workDir, previewPath, bestStartFrame);

    // Use the midpoint of the chosen window as the poster so the still
    // matches the action inside the clip instead of an arbitrary frame.
    const posterFrameIndex =
      bestStartFrame + Math.floor(PREVIEW_LENGTH_FRAMES / 2);
    const posterPath = join(
      workDir,
      `frame-${posterFrameIndex.toString().padStart(3, '0')}.webp`,
    );

    const [previewBuffer, posterBuffer] = await Promise.all([
      readFile(previewPath),
      readFile(posterPath),
    ]);

    const [previewUpload, posterUpload] = await Promise.all([
      uploadFile({
        key: getArcadeGameplayPreviewStorageKey(slug, versionNumber),
        body: previewBuffer,
        access: 'public',
        contentType: 'video/webm',
      }),
      uploadFile({
        key: getArcadeGameplayPosterStorageKey(slug, versionNumber),
        body: posterBuffer,
        access: 'public',
        contentType: 'image/webp',
      }),
    ]);

    await db
      .update(arcadeGameVersions)
      .set({
        gameplayPreviewUrl: previewUpload.url,
        gameplayPosterUrl: posterUpload.url,
        gameplayPreviewStatus: 'ready',
      })
      .where(eq(arcadeGameVersions.id, versionId));
  } catch (error) {
    console.error(
      `[arcade-gameplay-preview] failed for version ${versionId}`,
      error,
    );

    try {
      await db
        .update(arcadeGameVersions)
        .set({ gameplayPreviewStatus: 'failed' })
        .where(eq(arcadeGameVersions.id, versionId));
    } catch (dbError) {
      console.error(
        `[arcade-gameplay-preview] failed to mark version ${versionId} as failed`,
        dbError,
      );
    }
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {
      /* best effort cleanup */
    });
  }
}

async function extractFramesToDir(
  zipBuffer: Buffer,
  workDir: string,
): Promise<number> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  let written = 0;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    // Frames are expected at the zip root: frame-000.webp, frame-001.webp, ...
    const name = entry.entryName.replace(/^.*\//, '');
    if (!/^frame-\d{3}\.webp$/.test(name)) continue;

    await writeFile(join(workDir, name), entry.getData());
    written += 1;
  }

  return written;
}

// Runs an analysis pass that emits per-frame scdet scores (MAFD = mean
// absolute frame difference). The metadata filter writes to stdout while
// ffmpeg's usual logging stays on stderr.
function analyzeFrameScores(
  workDir: string,
  frameCount: number,
): Promise<number[]> {
  const args = [
    '-y',
    '-framerate',
    String(CAPTURE_FPS),
    '-i',
    join(workDir, 'frame-%03d.webp'),
    '-vf',
    'scdet=threshold=0,metadata=mode=print:file=-',
    '-an',
    '-f',
    'null',
    '-',
  ];

  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `ffmpeg analysis exited with code ${code}: ${stderr.slice(-500)}`,
          ),
        );
        return;
      }

      try {
        const scores = parseScdetScores(stdout, frameCount);
        resolve(scores);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Parses output shaped like:
//   frame:0    pts:0       pts_time:0
//   lavfi.scd.mafd=0.000000
//   lavfi.scd.score=0.000000
//   frame:1    pts:1       pts_time:0.1
//   lavfi.scd.mafd=4.213000
//   lavfi.scd.score=4.213000
function parseScdetScores(output: string, frameCount: number): number[] {
  const scores = new Array<number>(frameCount).fill(0);
  const frameRegex = /^frame:(\d+)\b/;
  const mafdRegex = /^lavfi\.scd\.mafd=([\d.]+)/;

  let currentFrame = -1;

  for (const rawLine of output.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const frameMatch = line.match(frameRegex);
    if (frameMatch) {
      currentFrame = Number.parseInt(frameMatch[1] ?? '-1', 10);
      continue;
    }

    const mafdMatch = line.match(mafdRegex);
    if (mafdMatch && currentFrame >= 0 && currentFrame < frameCount) {
      const value = Number.parseFloat(mafdMatch[1] ?? '0');
      if (Number.isFinite(value)) {
        scores[currentFrame] = value;
      }
    }
  }

  return scores;
}

// Slides a window across the score array and returns the start frame of
// the highest-scoring window. Ties break toward the later window so we
// avoid the opening seconds where players are still orienting themselves.
function pickBestWindow(scores: number[], windowSize: number): number {
  if (scores.length < windowSize) {
    throw new Error(
      `Not enough frames for a ${windowSize}-frame window: got ${scores.length}.`,
    );
  }

  let windowSum = 0;
  for (let i = 0; i < windowSize; i += 1) {
    windowSum += scores[i] ?? 0;
  }

  let bestStart = 0;
  let bestSum = windowSum;

  for (let start = 1; start + windowSize <= scores.length; start += 1) {
    windowSum +=
      (scores[start + windowSize - 1] ?? 0) - (scores[start - 1] ?? 0);
    if (windowSum >= bestSum) {
      bestSum = windowSum;
      bestStart = start;
    }
  }

  // If every score is zero (static game, scdet detected nothing), fall back
  // to the middle of the capture instead of the very beginning.
  if (bestSum === 0) {
    return Math.max(0, Math.floor((scores.length - windowSize) / 2));
  }

  return bestStart;
}

function encodePreviewWebm(
  workDir: string,
  outputPath: string,
  startFrame: number,
): Promise<void> {
  // libvpx-vp9 gives better quality per byte for these tiny clips.
  // -start_number tells ffmpeg where to begin the image sequence, and
  // -frames:v caps the encode at the chosen window length.
  const args = [
    '-y',
    '-framerate',
    String(CAPTURE_FPS),
    '-start_number',
    String(startFrame),
    '-i',
    join(workDir, 'frame-%03d.webp'),
    '-frames:v',
    String(PREVIEW_LENGTH_FRAMES),
    '-c:v',
    'libvpx-vp9',
    '-b:v',
    PREVIEW_VIDEO_BITRATE,
    '-pix_fmt',
    'yuv420p',
    '-an',
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`),
        );
      }
    });
  });
}
