import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { exportAllParticipants } from '@/src/jobs/export-all-participants.job';

async function run() {
  console.log('Generating CSV...');
  const csv = await exportAllParticipants();

  const tmpFile = join(tmpdir(), 'export-all-participants-test.csv');
  writeFileSync(tmpFile, csv);
  console.log(`\nCSV written to: ${tmpFile}`);
  console.log(`Total size: ${csv.length} bytes`);
  console.log(`Lines: ${csv.split('\n').length}`);
}

run().catch(console.error);
