import { GoogleServiceAccountAuth } from '@/src/lib/google/auth';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  createdTime?: string;
  modifiedTime?: string;
}

interface DriveFilesListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

export class GoogleDriveClient {
  private auth: GoogleServiceAccountAuth;

  constructor(serviceAccountBase64: string, scopes: string[]) {
    this.auth = new GoogleServiceAccountAuth(serviceAccountBase64, scopes);
  }

  async listFilesInFolder(folderId: string): Promise<DriveFile[]> {
    try {
      const query = encodeURIComponent(
        `'${folderId}' in parents and trashed = false`,
      );
      const fields = 'files(id,name,mimeType,parents,createdTime,modifiedTime)';
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=name`;

      const response = await this.auth.makeAuthenticatedRequest(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to list files: ${response.status} - ${errorText}`,
        );
      }

      const data: DriveFilesListResponse = await response.json();
      return data.files || [];
    } catch (error) {
      console.error(`Failed to list files in folder ${folderId}:`, error);
      throw error;
    }
  }

  async getFileInfo(fileId: string): Promise<DriveFile> {
    try {
      const fields = 'id,name,mimeType,parents';
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${fields}`;

      const response = await this.auth.makeAuthenticatedRequest(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get file info: ${response.status} - ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to get file info for ${fileId}:`, error);
      throw error;
    }
  }

  async listFoldersInFolder(folderId: string): Promise<DriveFile[]> {
    try {
      const query = encodeURIComponent(
        `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      );
      const fields = 'files(id,name,mimeType,parents)';
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=name`;

      const response = await this.auth.makeAuthenticatedRequest(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to list folders: ${response.status} - ${errorText}`,
        );
      }

      const data: DriveFilesListResponse = await response.json();
      return data.files || [];
    } catch (error) {
      console.error(`Failed to list folders in ${folderId}:`, error);
      throw error;
    }
  }
}
