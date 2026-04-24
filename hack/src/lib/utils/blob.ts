// Image upload function for company logos, profile pictures, etc.
async function _uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/files/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload image');
  }

  const data = await response.json();
  return data.url as string;
}

// Document upload function for update reports, supporting documents, etc.
export async function uploadDocumentFile(
  file: File,
  prefix?: string,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  if (prefix) {
    formData.append('prefix', prefix);
  }

  const response = await fetch('/api/files/upload-document', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload document');
  }

  const data = await response.json();
  return data.url as string;
}

// Media upload function for photos/videos (up to 30MB)
export async function uploadMediaFile(
  file: File,
  prefix?: string,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  if (prefix) {
    formData.append('prefix', prefix);
  }

  const response = await fetch('/api/files/upload-media', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload media');
  }

  const data = await response.json();
  return data.url as string;
}
