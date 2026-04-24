import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { hackerProfiles } from '@/src/lib/db/schema';
import { RunwayWebSection } from './_components/runway-web-section';

export default async function RunwayCreditsPage() {
  const session = await onlyAuthenticated();

  if (!session.user.linkedId) {
    redirect('/login?error=no_hacker_linked');
  }

  // Search for Runway data across all hacker profiles for this user
  const allProfiles = await db
    .select()
    .from(hackerProfiles)
    .where(eq(hackerProfiles.hackerId, session.user.linkedId))
    .orderBy(desc(hackerProfiles.createdAt));

  // Find the first profile with Runway data
  const profileWithRunwayData = allProfiles.find((p) => p.runwayEmail);

  const profile = profileWithRunwayData || allProfiles[0];

  return (
    <div className="space-y-6">
      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
        <div className="space-y-6">
          <div className="border-primary/20 border-b pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
                  <span className="bg-primary px-2 py-1 text-background">
                    RUNWAY
                  </span>{' '}
                  CREDITS
                </h2>
                <p className="mt-2 text-primary/70 text-sm">
                  Accede a herramientas de AI generativa de video
                </p>
              </div>
              <div
                className="h-8 w-32"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  maskImage: 'url(/assets/logos/runway-crop.png)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskImage: 'url(/assets/logos/runway-crop.png)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                }}
              />
            </div>
          </div>

          <RunwayWebSection hackerProfile={profile} />
        </div>
      </div>
    </div>
  );
}
