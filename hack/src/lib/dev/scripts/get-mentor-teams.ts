import { config } from 'dotenv';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is required');
}

const sql = postgres(connectionString);

async function getMentorTeams() {
  // First check if there are any mentors
  const mentorCount = await sql`SELECT COUNT(*) as count FROM mentors`;
  const teamCount =
    await sql`SELECT COUNT(*) as count FROM teams WHERE mentor_id IS NOT NULL`;

  console.log(`\n📊 Database stats:`);
  console.log(`   Total mentors: ${Number(mentorCount[0].count)}`);
  console.log(`   Teams with mentors: ${Number(teamCount[0].count)}\n`);

  const result = await sql`
    SELECT 
      m.id as mentor_id,
      m.full_name as mentor_name,
      json_agg(
        json_build_object(
          'slug', t.slug,
          'person_name', COALESCE(
            (SELECT h.full_name 
             FROM hacker_profiles hp 
             JOIN hackers h ON h.id = hp.hacker_id 
             WHERE hp.team_id = t.id 
             ORDER BY h.full_name 
             LIMIT 1),
            'No members'
          )
        )
        ORDER BY 
          CASE 
            WHEN t.slug IN ('team-1', 'team-2', 'team-3', 'team-5', 'team-6', 'team-7', 'team-8', 'team-10', 'team-11', 'solo-4') 
            THEN 0 
            ELSE 1 
          END,
          t.slug
      ) as teams,
      COUNT(t.id) as team_count
    FROM mentors m
    INNER JOIN teams t ON t.mentor_id = m.id
    GROUP BY m.id, m.full_name
    HAVING COUNT(t.id) > 0
    ORDER BY m.full_name;
  `;

  if (result.length === 0) {
    console.log('⚠️  No mentors with teams assigned found in the database.');
    await sql.end();
    return;
  }

  console.log('\n📊 Teams assigned to each mentor:\n');
  console.log('─'.repeat(80));

  for (const row of result) {
    const teams = row.teams || [];
    const teamCount = Number(row.team_count);

    console.log(`\n👤 Mentor: ${row.mentor_name}`);
    console.log(`   ID: ${row.mentor_id}`);
    console.log(`   Teams (${teamCount}):`);

    for (const team of teams) {
      console.log(`      • ${team.slug} (${team.person_name})`);
    }
  }

  console.log('\n─'.repeat(80));
  console.log(`\nTotal mentors with teams: ${result.length}`);

  await sql.end();
}

getMentorTeams().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
