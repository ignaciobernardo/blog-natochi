import { Readable } from 'node:stream';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from '@/src/lib/storage/types';

interface S3StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle: boolean;
  publicUrlBase?: string;
  setPublicAcl: boolean;
}

let cachedS3Config: S3StorageConfig | null = null;
let cachedS3Client: S3Client | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required S3 environment variable: ${name}`);
  }
  return value;
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  throw new Error(
    `Invalid boolean value for ${name}: "${value}". Expected "true" or "false".`,
  );
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function encodeStorageKey(key: string): string {
  return key
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function getS3Config(): S3StorageConfig {
  if (cachedS3Config) {
    return cachedS3Config;
  }

  cachedS3Config = {
    accessKeyId: getRequiredEnv('S3_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnv('S3_SECRET_ACCESS_KEY'),
    sessionToken: process.env.S3_SESSION_TOKEN,
    region: getRequiredEnv('S3_REGION'),
    bucket: getRequiredEnv('S3_BUCKET'),
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: parseBooleanEnv('S3_FORCE_PATH_STYLE', false),
    publicUrlBase: process.env.S3_PUBLIC_URL_BASE,
    setPublicAcl: parseBooleanEnv('S3_SET_PUBLIC_ACL', false),
  };

  return cachedS3Config;
}

function getS3Client(): S3Client {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const config = getS3Config();
  cachedS3Client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      sessionToken: config.sessionToken,
    },
  });

  return cachedS3Client;
}

function toS3Body(body: StorageUploadInput['body']) {
  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }

  if (body instanceof ReadableStream) {
    return Readable.fromWeb(
      body as unknown as import('node:stream/web').ReadableStream,
    );
  }

  return body;
}

function getPublicUrlForKey(key: string, config: S3StorageConfig): string {
  const encodedKey = encodeStorageKey(key);

  if (config.publicUrlBase) {
    return `${trimTrailingSlash(config.publicUrlBase)}/${encodedKey}`;
  }

  if (config.endpoint) {
    const endpoint = trimTrailingSlash(config.endpoint);
    return config.forcePathStyle
      ? `${endpoint}/${config.bucket}/${encodedKey}`
      : `${endpoint}/${encodedKey}`;
  }

  if (config.region === 'us-east-1') {
    return `https://${config.bucket}.s3.amazonaws.com/${encodedKey}`;
  }

  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${encodedKey}`;
}

async function uploadToS3(
  input: StorageUploadInput,
): Promise<StorageUploadResult> {
  const config = getS3Config();
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
    Body: toS3Body(input.body),
    ContentType: input.contentType,
    ACL:
      input.access === 'public' && config.setPublicAcl
        ? 'public-read'
        : undefined,
  });

  await client.send(command);

  return {
    key: input.key,
    url: getPublicUrlForKey(input.key, config),
  };
}

export const s3StorageProvider: StorageProvider = {
  upload: uploadToS3,
};
