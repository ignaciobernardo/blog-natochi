import { GoogleSheetsClient } from '@/src/clients/google-sheets';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export interface TeamUploadTracking {
  teamSlug: string;
  rawVideosUrls: string | null;
  slidesUpdatedAt: string | null;
  demoUpdatedAt: string | null;
  uploadFolderUrl: string | null;
  videoUrl: string | null;
}

class GoogleSheetsService {
  private client: GoogleSheetsClient | null = null;
  private trackingSpreadsheetUrl: string;

  constructor() {
    const serviceAccountBase64 =
      process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 || '';
    this.trackingSpreadsheetUrl = process.env.TEAM_UPLOAD_TRACKING_EXCEL || '';

    if (!this.trackingSpreadsheetUrl) {
      console.warn('TEAM_UPLOAD_TRACKING_EXCEL not configured');
      return;
    }

    if (!serviceAccountBase64) {
      console.warn('GOOGLE_SERVICE_ACCOUNT_BASE64 not configured');
      return;
    }

    try {
      this.client = new GoogleSheetsClient(serviceAccountBase64, SCOPES);
    } catch (error) {
      console.error('Failed to initialize Google Sheets client:', error);
    }
  }

  private extractSpreadsheetId(url: string): string {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error(`Invalid spreadsheet URL: ${url}`);
    }
    return match[1];
  }

  async getTeamUploadTracking(): Promise<TeamUploadTracking[]> {
    if (!this.client) {
      throw new Error('Google Sheets client not initialized');
    }

    const spreadsheetId = this.extractSpreadsheetId(
      this.trackingSpreadsheetUrl,
    );

    const rows = await this.client.getSheetData(spreadsheetId, 'Sheet1!A:Z');

    return rows
      .map((row) => ({
        teamSlug: row.team_slug || null,
        rawVideosUrls: row.raw_videos_urls || null,
        slidesUpdatedAt: row.slides_updated_at || null,
        demoUpdatedAt: row.demo_updated_at || null,
        uploadFolderUrl: row.upload_folder_url || null,
        videoUrl: row.raw_videos_urls || null,
      }))
      .filter((item): item is TeamUploadTracking => item.teamSlug !== null);
  }

  async updateSlidesUploadedAt(
    teamSlug: string,
    timestamp: Date,
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Google Sheets client not initialized');
    }

    const spreadsheetId = this.extractSpreadsheetId(
      this.trackingSpreadsheetUrl,
    );

    const rows = await this.client.getSheetData(spreadsheetId, 'Sheet1!A:Z');

    const rowIndex = rows.findIndex((row) => row.team_slug === teamSlug);

    if (rowIndex === -1) {
      console.warn(
        `Team ${teamSlug} not found in tracking spreadsheet, skipping update`,
      );
      return;
    }

    const actualRowNumber = rowIndex + 2;
    const formattedTimestamp = timestamp.toISOString();
    const range = `Sheet1!H${actualRowNumber}`;

    await this.client.updateCellValue(spreadsheetId, range, formattedTimestamp);

    console.log(
      `✅ Updated slides_updated_at for ${teamSlug} to ${formattedTimestamp}`,
    );
  }

  async updateDemoUploadedAt(teamSlug: string, timestamp: Date): Promise<void> {
    if (!this.client) {
      throw new Error('Google Sheets client not initialized');
    }

    const spreadsheetId = this.extractSpreadsheetId(
      this.trackingSpreadsheetUrl,
    );

    const rows = await this.client.getSheetData(spreadsheetId, 'Sheet1!A:Z');

    const rowIndex = rows.findIndex((row) => row.team_slug === teamSlug);

    if (rowIndex === -1) {
      console.warn(
        `Team ${teamSlug} not found in tracking spreadsheet, skipping update`,
      );
      return;
    }

    const actualRowNumber = rowIndex + 2;
    const formattedTimestamp = timestamp.toISOString();
    const range = `Sheet1!I${actualRowNumber}`;

    await this.client.updateCellValue(spreadsheetId, range, formattedTimestamp);

    console.log(
      `✅ Updated demo_updated_at for ${teamSlug} to ${formattedTimestamp}`,
    );
  }
}

export const googleSheetsService = new GoogleSheetsService();
