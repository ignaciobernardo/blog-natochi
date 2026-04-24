import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/src/lib/auth';
import { uploadFile } from '@/src/lib/storage';
import { getDocumentUploadStorageKey } from '@/src/lib/storage/keys';
import {
  documentBlobSchema,
  getFileTypeCategory,
} from '@/src/lib/validations/file';

const DocumentFileSchema = z.object({
  file: documentBlobSchema,
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate as document file (supports images and documents)
    const validatedFile = DocumentFileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename and prefix from formData
    const fileFromFormData = formData.get('file') as File;
    const prefix = formData.get('prefix') as string;

    // Add prefix and timestamp to filename
    const filename = getDocumentUploadStorageKey(fileFromFormData.name, prefix);

    const fileTypeCategory = getFileTypeCategory(file.type);
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await uploadFile({
        key: filename,
        body: fileBuffer,
        access: 'public',
      });

      return NextResponse.json({
        ...data,
        fileType: fileTypeCategory,
        size: file.size,
      });
    } catch (error) {
      console.error('Document upload error:', error);
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
