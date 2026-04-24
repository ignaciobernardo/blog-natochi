import { config } from 'dotenv';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is required');
}

async function checkHackerTeam(searchTerm: string) {
  const sql = postgres(connectionString);

  try {
    // Try searching by GitHub username first
    const result = await sql`
      SELECT 
        h.id as hacker_id,
        h.full_name,
        h.github,
        h.email,
        hp.team_id as team_id,
        t.id as team_id_from_teams,
        t.slug as team_slug,
        t.formed_on_site,
        t.table_number,
        CASE WHEN hp.team_id IS NOT NULL THEN 'hacker_profiles' ELSE NULL END as team_source
      FROM hackers h
      LEFT JOIN hacker_profiles hp ON hp.hacker_id = h.id
      LEFT JOIN teams t ON t.id = hp.team_id
      WHERE LOWER(h.github) = LOWER(${searchTerm})
         OR LOWER(h.github) LIKE LOWER(${`%${searchTerm}%`})
         OR LOWER(h.email) LIKE LOWER(${`%${searchTerm}%`})
         OR LOWER(h.full_name) LIKE LOWER(${`%${searchTerm}%`})
      ORDER BY hp.created_at DESC NULLS LAST
      LIMIT 10;
    `;

    if (result.length === 0) {
      console.log(`❌ No hacker found matching: ${searchTerm}`);
      console.log(`\n💡 Try searching by GitHub username, email, or name`);
      return;
    }

    const hacker = result[0];
    console.log(`\n👤 Hacker: ${hacker.full_name}`);
    console.log(`   GitHub: ${hacker.github || 'N/A'}`);
    console.log(`   Email: ${hacker.email}`);
    console.log(`   Hacker ID: ${hacker.hacker_id}`);

    if (hacker.team_id) {
      console.log(`\n✅ Team Information:`);
      console.log(`   Team ID: ${hacker.team_id}`);
      console.log(`   Team Slug: ${hacker.team_slug || 'N/A'}`);
      console.log(`   Team Source: ${hacker.team_source || 'N/A'}`);
      if (hacker.formed_on_site !== null) {
        console.log(`   Formed On Site: ${hacker.formed_on_site}`);
      }
      if (hacker.table_number) {
        console.log(`   Table Number: ${hacker.table_number}`);
      }
    } else {
      console.log(`\n⚠️  This hacker is not part of any team.`);
      console.log(`   (Checked hacker_profiles table)`);
    }

    if (result.length > 1) {
      console.log(
        `\n📝 Note: Found ${result.length} matching record(s). Showing the most recent.`,
      );
    }
  } catch (error) {
    console.error('❌ Error querying database:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

const githubUsername = process.argv[2] || 'rmena1';
checkHackerTeam(githubUsername)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
