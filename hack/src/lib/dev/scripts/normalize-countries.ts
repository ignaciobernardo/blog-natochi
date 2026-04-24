import { eq, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, submissions, teams } from '@/src/lib/db/schema';
import { normalizeCountry } from '@/src/lib/utils/countries';

async function normalizeCountries() {
  console.log('🌍 Starting country normalization...\n');

  const updates = {
    submissions: 0,
    teams: 0,
    hackerProfiles: 0,
  };

  try {
    // Get all distinct country values from all tables
    const [submissionsCountries, teamsCountries, profilesCountries] =
      await Promise.all([
        db
          .selectDistinct({ country: submissions.country })
          .from(submissions)
          .where(sql`${submissions.country} IS NOT NULL`),
        db
          .selectDistinct({ country: teams.country })
          .from(teams)
          .where(sql`${teams.country} IS NOT NULL`),
        db
          .selectDistinct({ country: hackerProfiles.country })
          .from(hackerProfiles)
          .where(sql`${hackerProfiles.country} IS NOT NULL`),
      ]);

    console.log('📊 Current country values:');
    console.log(
      'Submissions:',
      submissionsCountries.map((r) => r.country).join(', '),
    );
    console.log('Teams:', teamsCountries.map((r) => r.country).join(', '));
    console.log(
      'Hacker Profiles:',
      profilesCountries.map((r) => r.country).join(', '),
    );
    console.log('');

    // Normalize submissions
    console.log('🔄 Normalizing submissions...');
    for (const { country } of submissionsCountries) {
      const normalized = normalizeCountry(country);
      if (normalized !== country) {
        const _result = await db
          .update(submissions)
          .set({ country: normalized })
          .where(eq(submissions.country, country));
        console.log(`  ✓ ${country} → ${normalized}`);
        updates.submissions++;
      }
    }

    // Normalize teams
    console.log('🔄 Normalizing teams...');
    for (const { country } of teamsCountries) {
      const normalized = normalizeCountry(country);
      if (normalized !== country) {
        const _result = await db
          .update(teams)
          .set({ country: normalized })
          .where(eq(teams.country, country));
        console.log(`  ✓ ${country} → ${normalized}`);
        updates.teams++;
      }
    }

    // Normalize hacker profiles
    console.log('🔄 Normalizing hacker profiles...');
    for (const { country } of profilesCountries) {
      const normalized = normalizeCountry(country);
      if (normalized !== country) {
        const _result = await db
          .update(hackerProfiles)
          .set({ country: normalized })
          .where(eq(hackerProfiles.country, country));
        console.log(`  ✓ ${country} → ${normalized}`);
        updates.hackerProfiles++;
      }
    }

    console.log('\n✅ Country normalization complete!');
    console.log(`   Submissions updated: ${updates.submissions}`);
    console.log(`   Teams updated: ${updates.teams}`);
    console.log(`   Hacker profiles updated: ${updates.hackerProfiles}`);
    console.log(
      `   Total updates: ${updates.submissions + updates.teams + updates.hackerProfiles}`,
    );

    // Show final state
    const [finalSubmissions, finalTeams, finalProfiles] = await Promise.all([
      db
        .selectDistinct({ country: submissions.country })
        .from(submissions)
        .where(sql`${submissions.country} IS NOT NULL`),
      db
        .selectDistinct({ country: teams.country })
        .from(teams)
        .where(sql`${teams.country} IS NOT NULL`),
      db
        .selectDistinct({ country: hackerProfiles.country })
        .from(hackerProfiles)
        .where(sql`${hackerProfiles.country} IS NOT NULL`),
    ]);

    console.log('\n📊 Final country values:');
    console.log(
      'Submissions:',
      finalSubmissions
        .map((r) => r.country)
        .sort()
        .join(', '),
    );
    console.log(
      'Teams:',
      finalTeams
        .map((r) => r.country)
        .sort()
        .join(', '),
    );
    console.log(
      'Hacker Profiles:',
      finalProfiles
        .map((r) => r.country)
        .sort()
        .join(', '),
    );
  } catch (error) {
    console.error('❌ Error normalizing countries:', error);
    throw error;
  }
}

normalizeCountries()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
