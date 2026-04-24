import * as fs from 'fs';
import { google } from 'googleapis';
import * as path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

async function exploreDriveStructure() {
  // Load service account credentials
  const serviceAccountPath =
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './google-service-account.json';
  const baseFolderId = process.env.GOOGLE_DRIVE_BASE_FOLDER_ID;

  if (!baseFolderId) {
    throw new Error('GOOGLE_DRIVE_BASE_FOLDER_ID is not set in .env.local');
  }

  const keyFile = path.resolve(process.cwd(), serviceAccountPath);
  if (!fs.existsSync(keyFile)) {
    throw new Error(
      `Service account key file not found at: ${keyFile}\nPlease place your service-account-key.json in the project root.`,
    );
  }

  // Authenticate
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });

  console.log('✓ Authenticated with Google Drive API\n');

  // Get base folder info
  const baseFolder = await drive.files.get({
    fileId: baseFolderId,
    fields: 'id, name, mimeType',
  });

  console.log('Base folder:', baseFolder.data.name);
  console.log('Base folder ID:', baseFolder.data.id);
  console.log('\n--- Folder Structure ---\n');

  await exploreFolderRecursive(drive, baseFolderId, '', 0);
}

async function exploreFolderRecursive(
  drive: any,
  folderId: string,
  currentPath: string,
  depth: number,
  maxDepth: number = 3,
): Promise<void> {
  if (depth > maxDepth) {
    return;
  }

  const indent = '  '.repeat(depth);

  // List all files in this folder
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
    orderBy: 'name',
  });

  const files = response.data.files || [];

  for (const file of files) {
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
    const icon = isFolder ? '📁' : '📄';
    const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;

    console.log(`${indent}${icon} ${file.name} (${file.mimeType})`);

    if (isFolder && depth < maxDepth) {
      await exploreFolderRecursive(drive, file.id, fullPath, depth + 1);
    }
  }
}

exploreDriveStructure()
  .then(() => {
    console.log('\n✓ Done exploring folder structure!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
