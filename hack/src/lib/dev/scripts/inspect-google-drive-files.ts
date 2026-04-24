import { googleDriveService } from '@/src/services/google-drive';

const TEAMS_TO_CHECK = ['team-13', 'team-15'];

async function main() {
  console.log('\n🔍 CHECKING GOOGLE DRIVE FOR PRESENTATION FILES\n');

  try {
    const allTeamFiles = await googleDriveService.getAllTeamPresentationFiles();

    for (const teamSlug of TEAMS_TO_CHECK) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`${teamSlug}`);
      console.log(`${'='.repeat(60)}`);

      const teamFiles = allTeamFiles.find((tf) => tf.teamSlug === teamSlug);

      if (!teamFiles) {
        console.log('❌ NOT FOUND IN GOOGLE DRIVE');
        continue;
      }

      console.log('\n📄 SLIDES FILE:');
      if (teamFiles.slidesFile) {
        console.log(`  Name: ${teamFiles.slidesFile.name}`);
        console.log(`  ID: ${teamFiles.slidesFile.id}`);
        console.log(`  MIME Type: ${teamFiles.slidesFile.mimeType}`);
        console.log(`  Created: ${teamFiles.slidesFile.createdTime}`);
        console.log(`  Modified: ${teamFiles.slidesFile.modifiedTime}`);
      } else {
        console.log('  ❌ NOT FOUND');
      }

      console.log('\n🎥 DEMO FILE:');
      if (teamFiles.demoFile) {
        console.log(`  Name: ${teamFiles.demoFile.name}`);
        console.log(`  ID: ${teamFiles.demoFile.id}`);
        console.log(`  MIME Type: ${teamFiles.demoFile.mimeType}`);
        console.log(`  Created: ${teamFiles.demoFile.createdTime}`);
        console.log(`  Modified: ${teamFiles.demoFile.modifiedTime}`);
      } else {
        console.log('  ❌ NOT FOUND');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log(`\n${'='.repeat(60)}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
