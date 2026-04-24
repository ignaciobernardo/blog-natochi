import { GoogleDriveClient } from '@/src/clients/google-drive';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

async function debugDriveFilesDetailed() {
  console.log('🔍 Debugging Google Drive file detection (detailed)...\n');

  try {
    const serviceAccountBase64 =
      process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 || '';
    const baseFolderId = process.env.GOOGLE_DRIVE_BASE_FOLDER_ID || '';

    if (!baseFolderId || !serviceAccountBase64) {
      console.error('❌ Missing environment variables');
      return;
    }

    const client = new GoogleDriveClient(serviceAccountBase64, SCOPES);

    console.log('📂 Listing stage folders...\n');
    const stageFolders = await client.listFoldersInFolder(baseFolderId);
    console.log(`Found ${stageFolders.length} stage folders\n`);

    for (const stageFolder of stageFolders) {
      console.log(`\n📁 Stage: ${stageFolder.name} (${stageFolder.id})`);

      const teamFolders = await client.listFoldersInFolder(stageFolder.id);
      console.log(`  Found ${teamFolders.length} team folders`);

      for (const teamFolder of teamFolders) {
        if (teamFolder.name.includes('team-42')) {
          console.log(
            `\n  🎯 FOUND team-42 folder: ${teamFolder.name} (${teamFolder.id})`,
          );

          const files = await client.listFilesInFolder(teamFolder.id);
          console.log(`  Files in folder (${files.length} total):`);

          if (files.length === 0) {
            console.log('    ⚠️  No files found in folder!');
          } else {
            for (const file of files) {
              console.log(`    - ${file.name}`);
              console.log(`      Type: ${file.mimeType}`);
              console.log(`      ID: ${file.id}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

debugDriveFilesDetailed()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
