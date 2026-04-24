export type StorageAccess = 'public' | 'private';

export interface StorageUploadInput {
  key: string;
  body: ArrayBuffer | Blob | Buffer | ReadableStream | string;
  access: StorageAccess;
  contentType?: string;
}

export interface StorageUploadResult {
  key: string;
  url: string;
}

export interface StorageProvider {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
}
