import { GoogleSheetsClient } from '@/src/clients/google-sheets';

async function debugSheetsRaw() {
  console.log('🔍 Debugging raw Google Sheets data...\n');

  try {
    const serviceAccountBase64 =
      process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 || '';
    const trackingSpreadsheetUrl = process.env.TEAM_UPLOAD_TRACKING_EXCEL || '';

    if (!trackingSpreadsheetUrl || !serviceAccountBase64) {
      throw new Error('Missing environment variables');
    }

    const match = trackingSpreadsheetUrl.match(
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    );
    if (!match) {
      throw new Error('Invalid spreadsheet URL');
    }
    const spreadsheetId = match[1];

    const client = new GoogleSheetsClient(serviceAccountBase64, [
      'https://www.googleapis.com/auth/spreadsheets',
    ]);

    const data = await client.getSheetData(spreadsheetId, 'Sheet1!A1:Z2');

    console.log('Raw data (first 2 rows):');
    console.log(JSON.stringify(data, null, 2));

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      console.log('\n\nColumn mapping:');
      headers.forEach((header, index) => {
        const columnLetter = String.fromCharCode(65 + index);
        console.log(`  ${columnLetter}: ${header}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

debugSheetsRaw()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
