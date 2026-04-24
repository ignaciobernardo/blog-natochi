import { googleDriveService } from '@/src/services/google-drive';

async function debugDriveFiles() {
  console.log('🔍 Debugging Google Drive file detection...\n');

  try {
    const teamPresentationFiles =
      await googleDriveService.getAllTeamPresentationFiles();

    console.log(`Found ${teamPresentationFiles.length} team folders\n`);

    for (const teamFiles of teamPresentationFiles) {
      console.log(`\n📁 ${teamFiles.teamSlug}:`);
      console.log(
        `  Slides: ${teamFiles.slidesFile ? `✅ ${teamFiles.slidesFile.name}` : '❌ None'}`,
      );
      console.log(
        `  Demo: ${teamFiles.demoFile ? `✅ ${teamFiles.demoFile.name}` : '❌ None'}`,
      );
    }

    const team42 = teamPresentationFiles.find((t) => t.teamSlug === 'team-42');
    if (team42) {
      console.log('\n🎯 Found team-42:');
      console.log(JSON.stringify(team42, null, 2));
    } else {
      console.log('\n⚠️  team-42 not found in results');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

debugDriveFiles()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
