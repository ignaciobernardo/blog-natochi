import { s3StorageProvider } from '@/src/lib/storage/providers/s3';
import { vercelBlobStorageProvider } from '@/src/lib/storage/providers/vercel-blob';
import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from '@/src/lib/storage/types';

function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? 'vercel';

  switch (provider) {
    case 's3':
      return s3StorageProvider;
    case 'vercel':
      return vercelBlobStorageProvider;
    default:
      throw new Error(
        `Unsupported storage provider "${provider}". Expected "vercel" or "s3".`,
      );
  }
}

export async function uploadFile(
  input: StorageUploadInput,
): Promise<StorageUploadResult> {
  const provider = getStorageProvider();
  return provider.upload(input);
}
