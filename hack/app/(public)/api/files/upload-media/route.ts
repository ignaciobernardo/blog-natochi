import { NextResponse } from 'next/server';
import { z } from 'zod';
import { uploadFile } from '@/src/lib/storage';
import { getMediaUploadStorageKey } from '@/src/lib/storage/keys';
import {
  ALLOWED_MEDIA_TYPES,
  mediaBlobSchema,
} from '@/src/lib/validations/file';

const MediaFileSchema = z.object({
  file: mediaBlobSchema,
});

export async function POST(request: Request) {
  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = MediaFileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const fileFromFormData = formData.get('file') as File;
    const prefix = formData.get('prefix') as string;

    const filename = getMediaUploadStorageKey(fileFromFormData.name, prefix);

    const isVideo = ALLOWED_MEDIA_TYPES.slice(3).includes(file.type);
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await uploadFile({
        key: filename,
        body: fileBuffer,
        access: 'public',
      });

      return NextResponse.json({
        ...data,
        fileType: isVideo ? 'video' : 'image',
        size: file.size,
      });
    } catch (error) {
      console.error('Media upload error:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
