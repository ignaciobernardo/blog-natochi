import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, submissions } from '@/src/lib/db/schema';

const PLATANUS_HACK_24_EVENT_ID = '3e295340-929b-4d44-a35e-6f7e95b8cb89';
const PLATANUS_HACK_25_EVENT_ID = 'c1d62fec-80e9-412f-8930-a8738d2c7a16';

async function main() {
  // Get all Hack 24 profiles with data
  const hack24Profiles = await db
    .select({
      hackerId: hackerProfiles.hackerId,
      email: hackers.email,
      fullName: hackers.fullName,
      shoeSize: hackerProfiles.shoeSize,
      shirtSize: hackerProfiles.shirtSize,
      anthropicOrgId: hackerProfiles.anthropicOrgId,
      anthropicUsedProducts: hackerProfiles.anthropicUsedProducts,
      anthropicAccountEmail: hackerProfiles.anthropicAccountEmail,
      anthropicUpdates: hackerProfiles.anthropicUpdates,
      diet: hackerProfiles.diet,
      allergies: hackerProfiles.allergies,
      physicalIssues: hackerProfiles.physicalIssues,
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(eq(submissions.eventId, PLATANUS_HACK_24_EVENT_ID));

  console.log(`Found ${hack24Profiles.length} Hack 24 profiles`);

  // Get all Hack 25 profiles
  const hack25Profiles = await db
    .select({
      id: hackerProfiles.id,
      hackerId: hackerProfiles.hackerId,
      email: hackers.email,
      fullName: hackers.fullName,
      shoeSize: hackerProfiles.shoeSize,
      anthropicOrgId: hackerProfiles.anthropicOrgId,
      anthropicUsedProducts: hackerProfiles.anthropicUsedProducts,
      anthropicAccountEmail: hackerProfiles.anthropicAccountEmail,
      anthropicUpdates: hackerProfiles.anthropicUpdates,
      diet: hackerProfiles.diet,
      allergies: hackerProfiles.allergies,
      physicalIssues: hackerProfiles.physicalIssues,
    })
    .from(hackerProfiles)
    .innerJoin(submissions, eq(hackerProfiles.submissionId, submissions.id))
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(eq(submissions.eventId, PLATANUS_HACK_25_EVENT_ID));

  console.log(`Found ${hack25Profiles.length} Hack 25 profiles`);

  // Create a map of Hack 24 profiles by hacker ID
  const hack24ByHackerId = new Map(hack24Profiles.map((p) => [p.hackerId, p]));

  let updatedCount = 0;
  const updates: Array<{ name: string; email: string; fields: string[] }> = [];

  for (const hack25Profile of hack25Profiles) {
    const hack24Profile = hack24ByHackerId.get(hack25Profile.hackerId);
    if (!hack24Profile) continue;

    const fieldsToUpdate: Record<string, unknown> = {};
    const updatedFields: string[] = [];

    // Copy shoe size if missing in Hack 25 but exists in Hack 24
    if (hack25Profile.shoeSize === null && hack24Profile.shoeSize !== null) {
      fieldsToUpdate.shoeSize = hack24Profile.shoeSize;
      updatedFields.push(`shoeSize: ${hack24Profile.shoeSize}`);
    }

    // Copy Anthropic info if missing
    if (
      hack25Profile.anthropicOrgId === null &&
      hack24Profile.anthropicOrgId !== null
    ) {
      fieldsToUpdate.anthropicOrgId = hack24Profile.anthropicOrgId;
      updatedFields.push(`anthropicOrgId`);
    }

    if (
      hack25Profile.anthropicUsedProducts === null &&
      hack24Profile.anthropicUsedProducts !== null
    ) {
      fieldsToUpdate.anthropicUsedProducts =
        hack24Profile.anthropicUsedProducts;
      updatedFields.push(`anthropicUsedProducts`);
    }

    if (
      hack25Profile.anthropicAccountEmail === null &&
      hack24Profile.anthropicAccountEmail !== null
    ) {
      fieldsToUpdate.anthropicAccountEmail =
        hack24Profile.anthropicAccountEmail;
      updatedFields.push(`anthropicAccountEmail`);
    }

    if (
      hack25Profile.anthropicUpdates === null &&
      hack24Profile.anthropicUpdates !== null
    ) {
      fieldsToUpdate.anthropicUpdates = hack24Profile.anthropicUpdates;
      updatedFields.push(`anthropicUpdates`);
    }

    // Copy diet/health info if missing
    if (hack25Profile.diet === null && hack24Profile.diet !== null) {
      fieldsToUpdate.diet = hack24Profile.diet;
      updatedFields.push(`diet`);
    }

    if (hack25Profile.allergies === null && hack24Profile.allergies !== null) {
      fieldsToUpdate.allergies = hack24Profile.allergies;
      updatedFields.push(`allergies`);
    }

    if (
      hack25Profile.physicalIssues === null &&
      hack24Profile.physicalIssues !== null
    ) {
      fieldsToUpdate.physicalIssues = hack24Profile.physicalIssues;
      updatedFields.push(`physicalIssues`);
    }

    // Update if there are fields to update
    if (Object.keys(fieldsToUpdate).length > 0) {
      await db
        .update(hackerProfiles)
        .set(fieldsToUpdate)
        .where(eq(hackerProfiles.id, hack25Profile.id));

      updatedCount++;
      updates.push({
        name: hack25Profile.fullName,
        email: hack25Profile.email,
        fields: updatedFields,
      });
    }
  }

  console.log(
    `\nUpdated ${updatedCount} Hack 25 profiles with data from Hack 24:`,
  );
  for (const update of updates) {
    console.log(
      `  ${update.name} (${update.email}): ${update.fields.join(', ')}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
