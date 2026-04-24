import { GoogleServiceAccountAuth } from '@/src/lib/google/auth';

export interface SheetRow {
  [key: string]: string | null;
}

interface SheetsValuesResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

interface SpreadsheetInfo {
  spreadsheetId: string;
  properties: {
    title: string;
    locale: string;
    timeZone: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      index: number;
    };
  }>;
}

export class GoogleSheetsClient {
  private auth: GoogleServiceAccountAuth;

  constructor(serviceAccountBase64: string, scopes: string[]) {
    this.auth = new GoogleServiceAccountAuth(serviceAccountBase64, scopes);
  }

  async getSheetData(
    spreadsheetId: string,
    range: string,
  ): Promise<SheetRow[]> {
    try {
      const encodedRange = encodeURIComponent(range);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;

      const response = await this.auth.makeAuthenticatedRequest(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get sheet data: ${response.status} - ${errorText}`,
        );
      }

      const data: SheetsValuesResponse = await response.json();
      const rows = data.values || [];

      if (rows.length === 0) {
        return [];
      }

      const headers = rows[0] as string[];
      const dataRows = rows.slice(1);

      return dataRows.map((row) => {
        const rowData: SheetRow = {};
        headers.forEach((header, index) => {
          rowData[header] = (row[index] as string) || null;
        });
        return rowData;
      });
    } catch (error) {
      console.error(`Failed to get sheet data from ${spreadsheetId}:`, error);
      throw error;
    }
  }

  async getSpreadsheetInfo(spreadsheetId: string): Promise<SpreadsheetInfo> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

      const response = await this.auth.makeAuthenticatedRequest(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get spreadsheet info: ${response.status} - ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(
        `Failed to get spreadsheet info for ${spreadsheetId}:`,
        error,
      );
      throw error;
    }
  }

  async updateCellValue(
    spreadsheetId: string,
    range: string,
    value: string,
  ): Promise<void> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;

      const response = await this.auth.makeAuthenticatedRequest(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[value]],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update cell: ${response.status} - ${errorText}`,
        );
      }
    } catch (error) {
      console.error(
        `Failed to update cell in ${spreadsheetId} at ${range}:`,
        error,
      );
      throw error;
    }
  }
}
