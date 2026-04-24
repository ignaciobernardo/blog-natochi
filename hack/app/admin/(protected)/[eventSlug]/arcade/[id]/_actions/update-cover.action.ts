'use server';

import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { revalidateAdminEventPathByEventId } from '@/src/lib/admin/revalidate';
import { onlyAdmin } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { arcadeGameVersions } from '@/src/lib/db/schema';
import { uploadFile } from '@/src/lib/storage';
import { getArcadeCoverStorageKey } from '@/src/lib/storage/keys';
import {
  getArcadeChallengeById,
  getArcadeGameFlatById,
  getArcadeGameVersionById,
} from '@/src/queries/arcade-games';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface UpdateCoverResult {
  success: boolean;
  message: string;
}

export async function updateCoverAction(
  gameId: string,
  base64Image: string,
): Promise<UpdateCoverResult> {
  try {
    await onlyAdmin();

    // Validate base64 format
    if (!base64Image.startsWith('data:image/')) {
      return {
        success: false,
        message: 'Invalid image format',
      };
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = base64Image.split(',')[1];
    if (!base64Data) {
      return {
        success: false,
        message: 'Invalid base64 data',
      };
    }

    // Check file size
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        message: `Image size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
      };
    }

    const game = await getArcadeGameFlatById(gameId);

    if (!game) {
      return {
        success: false,
        message: 'Game not found',
      };
    }

    const version = await getArcadeGameVersionById(game.versionId);
    const challenge = await getArcadeChallengeById(game.challengeId);

    if (!version || !challenge) {
      return {
        success: false,
        message: 'Game version not found',
      };
    }

    // Compress and upload to Vercel Blob
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const compressedBuffer = await sharp(imageBuffer)
      .png({
        compressionLevel: 9,
        palette: true,
        quality: 80,
      })
      .toBuffer();

    const blob = await uploadFile({
      key: getArcadeCoverStorageKey(game.slug),
      body: compressedBuffer,
      access: 'public',
      contentType: 'image/png',
    });

    // Update the latest version cover
    await db
      .update(arcadeGameVersions)
      .set({
        coverUrl: blob.url,
        updatedAt: new Date(),
      })
      .where(eq(arcadeGameVersions.id, version.id));

    await revalidateAdminEventPathByEventId(
      challenge.eventId,
      'arcade',
      gameId,
    );
    await revalidateAdminEventPathByEventId(challenge.eventId, 'arcade');

    return {
      success: true,
      message: 'Cover image updated successfully',
    };
  } catch (error) {
    console.error('Update cover error:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update cover',
    };
  }
}
