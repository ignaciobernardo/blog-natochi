import { sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';

async function fixGithubTrailingSlashes() {
  console.log('Starting to fix GitHub URLs with trailing slashes...');

  try {
    // Update all github URLs that end with '/' by removing the trailing slash
    const result = await db.execute(sql`
      UPDATE hackers
      SET github = RTRIM(github, '/')
      WHERE github LIKE '%/'
    `);

    console.log('✅ Successfully fixed GitHub URLs with trailing slashes');
    console.log(`Rows affected: ${result.rowCount}`);

    // Verify the fix
    const remaining = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM hackers
      WHERE github LIKE '%/'
    `);

    console.log(
      `Remaining URLs with trailing slashes: ${remaining.rows[0].count}`,
    );
  } catch (error) {
    console.error('❌ Error fixing GitHub URLs:', error);
    throw error;
  }
}

fixGithubTrailingSlashes()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
