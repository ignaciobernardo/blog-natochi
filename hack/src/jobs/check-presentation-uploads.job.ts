import { eq, inArray } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { presentationUploads, teams } from '@/src/lib/db/schema';
import { presentationUploadNotifier } from '@/src/operators/slack/presentation-upload-notifier';
import { googleDriveService } from '@/src/services/google-drive';
import { googleSheetsService } from '@/src/services/google-sheets';

export async function checkPresentationUploads(): Promise<void> {
  console.log('\n📊 Checking for presentation uploads...\n');

  try {
    const [allTeams, teamPresentationFiles] = await Promise.all([
      db.select({ id: teams.id, slug: teams.slug }).from(teams),
      googleDriveService.getAllTeamPresentationFiles(),
    ]);

    console.log(`Found ${allTeams.length} teams in database`);
    console.log(
      `Found ${teamPresentationFiles.length} team folders in Google Drive`,
    );

    const teamMap = new Map(allTeams.map((t) => [t.slug, t]));
    const validTeamFiles = teamPresentationFiles.filter((tf) => {
      if (!teamMap.has(tf.teamSlug)) {
        console.warn(`Team not found in database: ${tf.teamSlug}`);
        return false;
      }
      return true;
    });

    const teamIds = validTeamFiles
      .map((tf) => teamMap.get(tf.teamSlug)?.id)
      .filter((id): id is string => id !== undefined);
    const existingRecords = await db.query.presentationUploads.findMany({
      where: inArray(presentationUploads.teamId, teamIds),
    });

    const existingRecordsMap = new Map(
      existingRecords.map((r) => [r.teamId, r]),
    );

    const now = new Date();
    const operations: Promise<void>[] = [];
    const notifications: Promise<void>[] = [];
    const sheetsUpdates: Promise<void>[] = [];

    for (const teamFiles of validTeamFiles) {
      const team = teamMap.get(teamFiles.teamSlug);
      if (!team) continue;
      const existingRecord = existingRecordsMap.get(team.id);
      const hasSlidesFile = !!teamFiles.slidesFile;
      const hasDemoFile = !!teamFiles.demoFile;

      const driveFolderId =
        teamFiles.slidesFile?.parents?.[0] || teamFiles.demoFile?.parents?.[0];

      // Always update sheets with file timestamps (complete refresh)
      if (hasSlidesFile && teamFiles.slidesFile?.modifiedTime) {
        const slidesTimestamp = new Date(teamFiles.slidesFile.modifiedTime);
        sheetsUpdates.push(
          googleSheetsService.updateSlidesUploadedAt(
            teamFiles.teamSlug,
            slidesTimestamp,
          ),
        );
      }

      if (hasDemoFile && teamFiles.demoFile?.modifiedTime) {
        const demoTimestamp = new Date(teamFiles.demoFile.modifiedTime);
        sheetsUpdates.push(
          googleSheetsService.updateDemoUploadedAt(
            teamFiles.teamSlug,
            demoTimestamp,
          ),
        );
      }

      if (!existingRecord) {
        if (hasSlidesFile || hasDemoFile) {
          operations.push(
            db
              .insert(presentationUploads)
              .values({
                teamId: team.id,
                slidesUploadedAt: hasSlidesFile ? now : null,
                demoUploadedAt: hasDemoFile ? now : null,
              })
              .then(() => {
                console.log(`✅ Created record for ${teamFiles.teamSlug}`);
              }),
          );

          if (hasSlidesFile) {
            notifications.push(
              presentationUploadNotifier.notifyPresentationUpload(
                teamFiles.teamSlug,
                'slides',
                driveFolderId,
              ),
            );
          }

          if (hasDemoFile) {
            notifications.push(
              presentationUploadNotifier.notifyPresentationUpload(
                teamFiles.teamSlug,
                'demo',
                driveFolderId,
              ),
            );
          }
        }
      } else {
        const needsUpdate =
          (hasSlidesFile && !existingRecord.slidesUploadedAt) ||
          (hasDemoFile && !existingRecord.demoUploadedAt);

        if (needsUpdate) {
          const updates: {
            slidesUploadedAt?: Date;
            demoUploadedAt?: Date;
          } = {};

          if (hasSlidesFile && !existingRecord.slidesUploadedAt) {
            updates.slidesUploadedAt = now;
            notifications.push(
              presentationUploadNotifier.notifyPresentationUpload(
                teamFiles.teamSlug,
                'slides',
                driveFolderId,
              ),
            );
          }

          if (hasDemoFile && !existingRecord.demoUploadedAt) {
            updates.demoUploadedAt = now;
            notifications.push(
              presentationUploadNotifier.notifyPresentationUpload(
                teamFiles.teamSlug,
                'demo',
                driveFolderId,
              ),
            );
          }

          operations.push(
            db
              .update(presentationUploads)
              .set(updates)
              .where(eq(presentationUploads.teamId, team.id))
              .then(() => {
                console.log(`✅ Updated record for ${teamFiles.teamSlug}`);
              }),
          );
        }
      }
    }

    const [, notificationResults, sheetsResults] = await Promise.all([
      Promise.all(operations),
      Promise.allSettled(notifications),
      Promise.allSettled(sheetsUpdates),
    ]);

    const failedNotifications = notificationResults.filter(
      (r) => r.status === 'rejected',
    );
    if (failedNotifications.length > 0) {
      console.warn(
        `⚠️  ${failedNotifications.length} notifications failed to send`,
      );
      failedNotifications.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('Error:', result.reason);
        }
      });
    }

    const failedSheets = sheetsResults.filter((r) => r.status === 'rejected');
    if (failedSheets.length > 0) {
      console.warn(`⚠️  ${failedSheets.length} sheets updates failed`);
      failedSheets.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('Sheets error:', result.reason);
        }
      });
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Processed ${validTeamFiles.length} teams`);
    console.log(`📤 Sent ${notifications.length} notifications`);
    console.log(`📝 Updated ${sheetsUpdates.length} sheets records`);
    console.log(`✅ Check completed successfully\n`);
  } catch (error) {
    console.error('❌ Error checking presentation uploads:', error);
    throw error;
  }
}
