import { googleSheetsService } from '@/src/services/google-sheets';

async function testSheetsUpdate() {
  console.log('🔍 Testing Google Sheets update functionality...\n');

  try {
    const trackingData = await googleSheetsService.getTeamUploadTracking();
    console.log(`✅ Found ${trackingData.length} team records\n`);

    const teamToUpdate = trackingData.find(
      (t) => t.teamSlug === 'team-42' && !t.contentUploadedAt,
    );

    if (!teamToUpdate) {
      console.log('⚠️  team-42 already has contentUploadedAt or not found');
      console.log('Checking current state of team-42...');

      const team42 = trackingData.find((t) => t.teamSlug === 'team-42');
      if (team42) {
        console.log('\nTeam-42 current state:');
        console.log(`  Team Slug: ${team42.teamSlug}`);
        console.log(
          `  Content Uploaded At: ${team42.contentUploadedAt || 'Not set'}`,
        );
        console.log(
          `  Upload Folder URL: ${team42.uploadFolderUrl ? '✅ Present' : '❌ None'}`,
        );
      } else {
        console.log('❌ team-42 not found in spreadsheet');
      }

      console.log(
        '\n💡 Tip: To test the update, clear the content_uploaded_at cell for team-42 in the spreadsheet',
      );
      return;
    }

    console.log(`Found team to update: ${teamToUpdate.teamSlug}`);
    console.log('Updating content_uploaded_at to current timestamp...\n');

    const now = new Date();
    await googleSheetsService.updateContentUploadedAt(
      teamToUpdate.teamSlug,
      now,
    );

    console.log('\n✅ Update completed! Verifying...\n');

    const updatedData = await googleSheetsService.getTeamUploadTracking();
    const updatedTeam = updatedData.find(
      (t) => t.teamSlug === teamToUpdate.teamSlug,
    );

    if (updatedTeam?.contentUploadedAt) {
      console.log('✅ Verification successful!');
      console.log(`  Team: ${updatedTeam.teamSlug}`);
      console.log(`  Content Uploaded At: ${updatedTeam.contentUploadedAt}`);
    } else {
      console.log('❌ Verification failed - value not updated');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testSheetsUpdate()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
