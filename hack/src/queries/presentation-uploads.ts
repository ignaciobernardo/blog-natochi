import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  type PresentationUpload,
  presentationUploads,
} from '@/src/lib/db/schema';

export async function getPresentationUploadByTeamId(
  teamId: string,
): Promise<PresentationUpload | null> {
  const result = await db.query.presentationUploads.findFirst({
    where: eq(presentationUploads.teamId, teamId),
  });

  return result || null;
}
