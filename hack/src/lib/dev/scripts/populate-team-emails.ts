import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, teams } from '@/src/lib/db/schema';

async function populateTeamEmails() {
  const csvPath = path.join(process.cwd(), 'team-requests-tracking.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const header = lines[0];
  const dataLines = lines.slice(1);

  const hasEmailsColumn = header.includes('emails');
  const newLines: string[] = [hasEmailsColumn ? header : `${header},emails`];

  for (const line of dataLines) {
    const parts = line.split(',');
    const teamSlug = parts[0];

    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, teamSlug),
    });

    if (!team) {
      console.log(`Team not found: ${teamSlug}`);
      newLines.push(hasEmailsColumn ? line : `${line},`);
      continue;
    }

    const members = await db
      .select({
        email: hackers.email,
      })
      .from(hackerProfiles)
      .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
      .where(eq(hackerProfiles.teamId, team.id));

    const emails = members.map((m) => m.email).join(';');

    if (hasEmailsColumn) {
      const baseData = parts.slice(0, 4).join(',');
      newLines.push(`${baseData},${emails}`);
    } else {
      newLines.push(`${line},${emails}`);
    }
    console.log(`${teamSlug}: ${emails}`);
  }

  const newCsvContent = `${newLines.join('\n')}\n`;
  fs.writeFileSync(csvPath, newCsvContent, 'utf-8');
  console.log('\nCSV updated successfully!');
}

populateTeamEmails()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
