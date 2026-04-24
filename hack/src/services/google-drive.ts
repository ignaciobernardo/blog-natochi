import { type DriveFile, GoogleDriveClient } from '@/src/clients/google-drive';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export interface TeamPresentationFiles {
  teamSlug: string;
  slidesFile: DriveFile | null;
  demoFile: DriveFile | null;
}

const PDF_MIME_TYPE = 'application/pdf';
const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'video/mpeg',
  'video/x-ms-wmv',
];

class GoogleDriveService {
  private client: GoogleDriveClient | null = null;
  private baseFolderId: string;

  constructor() {
    const serviceAccountBase64 =
      process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 || '';
    this.baseFolderId = process.env.GOOGLE_DRIVE_BASE_FOLDER_ID || '';

    if (!this.baseFolderId) {
      console.warn('GOOGLE_DRIVE_BASE_FOLDER_ID not configured');
      return;
    }

    if (!serviceAccountBase64) {
      console.warn('GOOGLE_SERVICE_ACCOUNT_BASE64 not configured');
      return;
    }

    try {
      this.client = new GoogleDriveClient(serviceAccountBase64, SCOPES);
    } catch (error) {
      console.error('Failed to initialize Google Drive client:', error);
    }
  }

  async getAllTeamPresentationFiles(): Promise<TeamPresentationFiles[]> {
    if (!this.client) {
      throw new Error('Google Drive client not initialized');
    }

    const results: TeamPresentationFiles[] = [];

    const stageFolders = await this.client.listFoldersInFolder(
      this.baseFolderId,
    );

    for (const stageFolder of stageFolders) {
      const teamFolders = await this.client.listFoldersInFolder(stageFolder.id);

      for (const teamFolder of teamFolders) {
        const teamSlug = this.extractTeamSlug(teamFolder.name);

        if (!teamSlug) {
          console.warn(`Could not extract team slug from: ${teamFolder.name}`);
          continue;
        }

        const files = await this.client.listFilesInFolder(teamFolder.id);

        const slidesFile = files.find((f) => f.mimeType === PDF_MIME_TYPE);

        const demoFile = files.find((f) =>
          VIDEO_MIME_TYPES.includes(f.mimeType),
        );

        results.push({
          teamSlug,
          slidesFile: slidesFile || null,
          demoFile: demoFile || null,
        });
      }
    }

    return results;
  }

  private extractTeamSlug(folderName: string): string | null {
    const match = folderName.match(/^\d+\.(team-\d+|solo-\d+)$/);
    return match ? match[1] : null;
  }
}

export const googleDriveService = new GoogleDriveService();
