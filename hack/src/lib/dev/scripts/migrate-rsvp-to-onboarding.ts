import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { submissions, teams } from '@/src/lib/db/schema';

async function migrateRsvpToOnboarding() {
  console.log('⏳ Migrating RSVP statuses to onboarding statuses...');

  try {
    // Migrate submissions
    const submissionsRsvpOpen = await db
      .update(submissions)
      .set({ status: 'onboarding_request' })
      .where(eq(submissions.status, 'rsvp_open' as any))
      .returning({ id: submissions.id });

    const submissionsRsvpConfirmed = await db
      .update(submissions)
      .set({ status: 'onboarding_complete' })
      .where(eq(submissions.status, 'rsvp_confirmed' as any))
      .returning({ id: submissions.id });

    const submissionsRsvpExpired = await db
      .update(submissions)
      .set({ status: 'onboarding_expired' })
      .where(eq(submissions.status, 'rsvp_expired' as any))
      .returning({ id: submissions.id });

    console.log(
      `✅ Updated ${submissionsRsvpOpen.length} submissions from rsvp_open to onboarding_request`,
    );
    console.log(
      `✅ Updated ${submissionsRsvpConfirmed.length} submissions from rsvp_confirmed to onboarding_complete`,
    );
    console.log(
      `✅ Updated ${submissionsRsvpExpired.length} submissions from rsvp_expired to onboarding_expired`,
    );

    // Migrate teams
    const teamsRsvpOpen = await db
      .update(teams)
      .set({ status: 'onboarding_request' })
      .where(eq(teams.status, 'rsvp_open' as any))
      .returning({ id: teams.id });

    const teamsRsvpConfirmed = await db
      .update(teams)
      .set({ status: 'onboarding_complete' })
      .where(eq(teams.status, 'rsvp_confirmed' as any))
      .returning({ id: teams.id });

    const teamsRsvpExpired = await db
      .update(teams)
      .set({ status: 'onboarding_expired' })
      .where(eq(teams.status, 'rsvp_expired' as any))
      .returning({ id: teams.id });

    console.log(
      `✅ Updated ${teamsRsvpOpen.length} teams from rsvp_open to onboarding_request`,
    );
    console.log(
      `✅ Updated ${teamsRsvpConfirmed.length} teams from rsvp_confirmed to onboarding_complete`,
    );
    console.log(
      `✅ Updated ${teamsRsvpExpired.length} teams from rsvp_expired to onboarding_expired`,
    );

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateRsvpToOnboarding()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
