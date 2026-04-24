import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

const githubUrlFixes: Record<string, string | null> = {
  // Missing https://github.com/ prefix
  aleksiventas: 'https://github.com/aleksiventas',
  arturogaro: 'https://github.com/arturogaro',
  diegosiac: 'https://github.com/diegosiac',

  // Using www.github.com instead of github.com
  'https://www.github.com/crisrod34': 'https://github.com/crisrod34',
  'https://www.github.com/felipedino': 'https://github.com/felipedino',
  'https://www.github.com/fazuniga': 'https://github.com/fazuniga',
  'https://www.github.com/rpruizc': 'https://github.com/rpruizc',
  'https://www.github.com/josegermanx': 'https://github.com/josegermanx',
  'https://www.github.com/connistein': 'https://github.com/connistein',
  'https://www.github.com/kevinzeladacl': 'https://github.com/kevinzeladacl',

  // GitHub URLs with extra path segments
  'https://github.com/diego4paricio/diego4paricio':
    'https://github.com/diego4paricio',
  'https://github.com/orgs/nomad-e/people/sousaalex':
    'https://github.com/sousaalex',
  'https://github.com/jimmymp/jimmymp': 'https://github.com/jimmymp',
  'https://github.com/orgs/deepfeel-labs/people/carlosvillena17':
    'https://github.com/carlosvillena17',
  'https://github.com/thesouthernk/thesouthernk':
    'https://github.com/thesouthernk',

  // Non-GitHub URLs - set to null
  'https://picteto.cl': null,
  'https://www.linkedin.com/in/riglesias1': null,
  'https://cl.linkedin.com/in/marco-farias-arenas-735930159': null,
  'https://dribbble.com/byurac': null,

  // Incomplete URL
  'https://github.com': null,
};

async function fixGithubUrls() {
  console.log('🔧 Starting GitHub URL fixes...\n');

  let fixedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const [oldUrl, newUrl] of Object.entries(githubUrlFixes)) {
    try {
      // Find the hacker with this GitHub URL
      const [hacker] = await db
        .select()
        .from(hackers)
        .where(eq(hackers.github, oldUrl))
        .limit(1);

      if (!hacker) {
        console.log(`⚠️  No hacker found with GitHub: ${oldUrl}`);
        notFoundCount++;
        continue;
      }

      // Update the GitHub URL
      await db
        .update(hackers)
        .set({ github: newUrl })
        .where(eq(hackers.id, hacker.id));

      console.log(`✅ Fixed: ${hacker.fullName} (${hacker.email})`);
      console.log(`   Old: ${oldUrl}`);
      console.log(`   New: ${newUrl || 'NULL'}\n`);

      fixedCount++;
    } catch (error) {
      console.error(`❌ Error fixing ${oldUrl}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Fixed: ${fixedCount}`);
  console.log(`   ⚠️  Not found: ${notFoundCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${Object.keys(githubUrlFixes).length}`);
}

fixGithubUrls()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
