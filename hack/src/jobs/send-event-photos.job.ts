import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import EventPhotosEmail from '@/src/emails/event/event-photos';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  outboundEmails,
  teams,
} from '@/src/lib/db/schema';
import { sendEmail } from '@/src/lib/email';
import { getDefaultEvent } from '@/src/queries/events';

export async function sendEventPhotos() {
  console.log('[JOB] 📸 Sending event photos emails to team members...');

  // Get the default event (Platanus Hack 25)
  const event = await getDefaultEvent();

  if (!event) {
    console.log('[JOB] 📸 No default event found');
    return;
  }

  console.log(`[JOB] 📸 Using event: ${event.name} (${event.id})`);

  // Get all teams from this event
  const eventTeams = await db
    .select({
      id: teams.id,
    })
    .from(teams)
    .where(eq(teams.eventId, event.id));

  console.log(`[JOB] 📸 Found ${eventTeams.length} teams in this event`);

  if (eventTeams.length === 0) {
    console.log('[JOB] 📸 No teams to process');
    return;
  }

  const teamIds = eventTeams.map((t) => t.id);

  // Get all hackers from these teams
  const hackersInTeams = await db
    .select({
      hackerId: hackers.id,
      email: hackers.email,
      fullName: hackers.fullName,
      teamId: hackerProfiles.teamId,
    })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(
      and(
        inArray(hackerProfiles.teamId, teamIds),
        isNotNull(hackerProfiles.teamId),
      ),
    );

  console.log(
    `[JOB] 📸 Total hackers in these teams: ${hackersInTeams.length}`,
  );

  // Get all emails that have already been sent with template 'event-photos'
  const sentEventPhotosEmails = await db
    .select({
      to: outboundEmails.to,
      templateName: outboundEmails.templateName,
      status: outboundEmails.status,
    })
    .from(outboundEmails)
    .where(eq(outboundEmails.templateName, 'event-photos'));

  console.log(
    `[JOB] 📸 Found ${sentEventPhotosEmails.length} event photos emails already sent/queued`,
  );

  // Create a set of emails that have already received the event photos email
  const emailsAlreadySent = new Set(
    sentEventPhotosEmails.map((email) => email.to.toLowerCase()),
  );

  // Filter hackers who haven't received the email
  const hackersToEmail = hackersInTeams.filter(
    (hacker) => !emailsAlreadySent.has(hacker.email.toLowerCase()),
  );

  console.log(
    `[JOB] 📸 Hackers who need event photos email: ${hackersToEmail.length}`,
  );

  if (hackersToEmail.length === 0) {
    console.log(
      '[JOB] 📸 All eligible hackers have already received the event photos email!',
    );
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  // Send emails individually to each hacker
  for (const hacker of hackersToEmail) {
    try {
      console.log(
        `[JOB] 📸 Sending event photos email to ${hacker.fullName} (${hacker.email})...`,
      );

      await sendEmail({
        templateName: 'event-photos',
        template: EventPhotosEmail,
        templateProps: {
          hackerName: hacker.fullName,
        },
        to: hacker.email,
        subject: 'Fotos Oficiales Platanus Hack 25 ft. Buk 🍌📸🔥',
        sentByUserId: null,
      });

      successCount++;
    } catch (error) {
      console.error(
        `[JOB] 📸 Error sending to ${hacker.fullName} (${hacker.email}):`,
        error,
      );
      errorCount++;
    }
  }

  console.log(
    `[JOB] 📸 Event photos emails sent: ${successCount} queued, ${errorCount} failed`,
  );
}
