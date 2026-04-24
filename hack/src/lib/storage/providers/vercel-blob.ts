import { put } from '@vercel/blob';
import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from '@/src/lib/storage/types';

async function uploadToVercelBlob(
  input: StorageUploadInput,
): Promise<StorageUploadResult> {
  if (input.access !== 'public') {
    throw new Error('Vercel Blob provider only supports public access');
  }

  const blob = await put(input.key, input.body, {
    access: 'public',
    contentType: input.contentType,
  });

  return {
    key: input.key,
    url: blob.url,
  };
}

export const vercelBlobStorageProvider: StorageProvider = {
  upload: uploadToVercelBlob,
};
