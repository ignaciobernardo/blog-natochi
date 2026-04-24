import { assignTeamSlugs } from '@/src/jobs/assign-team-slugs.job';

async function main() {
  console.log('Starting team slug assignment...');
  await assignTeamSlugs();
  console.log('Done!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
