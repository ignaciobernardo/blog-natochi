import { googleSheetsService } from '@/src/services/google-sheets';

async function debugSheetsColumns() {
  console.log('🔍 Debugging Google Sheets column structure...\n');

  try {
    const trackingData = await googleSheetsService.getTeamUploadTracking();

    if (trackingData.length > 0) {
      const firstRow = trackingData[0];
      console.log('Column names found in first row:');
      console.log(JSON.stringify(firstRow, null, 2));

      console.log('\n\nAll keys:');
      console.log(Object.keys(firstRow));
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

debugSheetsColumns()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
