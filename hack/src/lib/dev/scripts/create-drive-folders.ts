import * as fs from 'fs';
import { google } from 'googleapis';
import * as path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

interface TeamRow {
  teamSlug: string;
  projectName: string;
  stage: string;
  stageOrder: string;
  emails: string;
}

async function createDriveFolders() {
  // Load service account credentials
  const serviceAccountPath =
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './google-service-account.json';
  const baseFolderId = process.env.GOOGLE_DRIVE_BASE_FOLDER_ID;

  if (!baseFolderId) {
    throw new Error('GOOGLE_DRIVE_BASE_FOLDER_ID is not set in .env.local');
  }

  const keyFile = path.resolve(process.cwd(), serviceAccountPath);
  if (!fs.existsSync(keyFile)) {
    throw new Error(
      `Service account key file not found at: ${keyFile}\nPlease place your google-service-account.json in the project root.`,
    );
  }

  // Authenticate
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });

  console.log('✓ Authenticated with Google Drive API\n');

  // Read CSV
  const csvPath = path.join(process.cwd(), 'team-requests-tracking.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const dataLines = lines.slice(1);

  // Parse CSV
  const teams: TeamRow[] = dataLines.map((line) => {
    const parts = line.split(',');
    return {
      teamSlug: parts[0],
      projectName: parts[1],
      stage: parts[2],
      stageOrder: parts[3],
      emails: parts.slice(4).join(','),
    };
  });

  // Group teams by stage
  const teamsByStage: Record<string, TeamRow[]> = {};
  for (const team of teams) {
    if (!teamsByStage[team.stage]) {
      teamsByStage[team.stage] = [];
    }
    teamsByStage[team.stage].push(team);
  }

  console.log('Teams grouped by stage:');
  for (const [stage, stageTeams] of Object.entries(teamsByStage)) {
    console.log(`  ${stage}: ${stageTeams.length} teams`);
  }
  console.log('');

  // Create stage folders and team folders
  const stages = ['16-final', '16-general', '17-main', '17-side'];
  const folderUrls: Record<string, string> = {};

  for (const stage of stages) {
    console.log(`Creating stage folder: ${stage}`);

    // Create stage folder
    const stageFolderMetadata = {
      name: stage,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [baseFolderId],
    };

    const stageFolderResponse = await drive.files.create({
      requestBody: stageFolderMetadata,
      fields: 'id, webViewLink',
    });

    const stageFolderId = stageFolderResponse.data.id;
    const stageFolderUrl = stageFolderResponse.data.webViewLink;

    if (!stageFolderId || !stageFolderUrl) {
      throw new Error(`Failed to create stage folder: ${stage}`);
    }

    console.log(`  ✓ Created: ${stageFolderUrl}`);

    // Create team folders within this stage
    const stageTeams = teamsByStage[stage] || [];

    for (const team of stageTeams) {
      const folderName = `${team.stageOrder.padStart(2, '0')}.${team.teamSlug}`;
      console.log(`    Creating team folder: ${folderName}`);

      const teamFolderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [stageFolderId],
      };

      const teamFolderResponse = await drive.files.create({
        requestBody: teamFolderMetadata,
        fields: 'id, webViewLink',
      });

      const teamFolderUrl = teamFolderResponse.data.webViewLink;
      if (!teamFolderUrl) {
        throw new Error(`Failed to create team folder: ${folderName}`);
      }
      folderUrls[team.teamSlug] = teamFolderUrl;

      console.log(`      ✓ ${teamFolderUrl}`);

      // Optional: Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('');
  }

  // Update CSV with folder URLs
  console.log('Updating CSV with folder URLs...');

  const newLines: string[] = [
    'team_slug,project_name,stage,stage_order,emails,folder_url',
  ];

  for (const team of teams) {
    const folderUrl = folderUrls[team.teamSlug] || '';
    const line = `${team.teamSlug},${team.projectName},${team.stage},${team.stageOrder},${team.emails},${folderUrl}`;
    newLines.push(line);
  }

  const newCsvContent = `${newLines.join('\n')}\n`;
  fs.writeFileSync(csvPath, newCsvContent, 'utf-8');

  console.log('✓ CSV updated successfully!\n');
  console.log('Done! All folders created and CSV updated.');
}

createDriveFolders()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
