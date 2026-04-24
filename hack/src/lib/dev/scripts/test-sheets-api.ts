import { googleSheetsService } from '@/src/services/google-sheets';

async function testSheetsApi() {
  console.log('🔍 Testing Google Sheets API...\n');

  try {
    const trackingData = await googleSheetsService.getTeamUploadTracking();

    console.log(`✅ Found ${trackingData.length} team upload records\n`);

    if (trackingData.length > 0) {
      console.log('📊 Sample records:');
      trackingData.slice(0, 5).forEach((record) => {
        console.log(`\n  Team: ${record.teamSlug}`);
        console.log(
          `  Slides Uploaded: ${record.slidesUpdatedAt ? `✅ ${record.slidesUpdatedAt}` : '❌ Not uploaded'}`,
        );
        console.log(
          `  Demo Uploaded: ${record.demoUpdatedAt ? `✅ ${record.demoUpdatedAt}` : '❌ Not uploaded'}`,
        );
        console.log(
          `  Folder URL: ${record.uploadFolderUrl ? '✅ Present' : '❌ None'}`,
        );
      });
    }

    console.log('\n✅ Google Sheets API is working correctly!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testSheetsApi()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
